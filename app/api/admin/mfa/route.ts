import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { readCookie, sameOriginError } from "@/lib/user-session";
import { apiError, apiOk } from "@/lib/api-helpers";
import {
  staffSession,
  createStaffSession,
  writeStaffCookie,
  SESSION_COOKIE,
} from "@/lib/admin-auth";
import {
  authenticator,
  encryptMfa,
  decryptMfa,
  newRecoveryCodes,
  recoveryHash,
  staffThrottle,
} from "@/lib/staff-security";
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.enum(["enroll", "verify", "recover", "regenerate"]),
      code: z.string().trim().min(1).max(100),
    })
    .strict(),
  z
    .object({
      action: z.literal("password"),
      currentPassword: z.string().min(1).max(200),
      newPassword: z.string().min(16).max(200),
    })
    .strict(),
]);
const failure = () =>
  apiError(
    "unauthorized",
    "The code or session could not be verified. Use a new authenticator code or an unused recovery code.",
    401,
  );
export async function GET(req: Request) {
  try {
    const token = readCookie(req, SESSION_COOKIE),
      s = token ? await staffSession(token) : null;
    if (!s) return failure();
    if (s.admin.mustChangePassword) return apiOk({ nextStep: "password" });
    if (s.admin.mfaConfirmedAt) return apiOk({ nextStep: "verify" });
    // Setup mutates only through POST. GET never generates/replaces an enrolled secret.
    return apiOk({
      nextStep: "enroll",
      configured: !!process.env.STAFF_MFA_ENCRYPTION_KEY,
    });
  } catch {
    return apiError(
      "service_unavailable",
      "Staff MFA is unavailable. Contact your verified platform operator.",
      503,
    );
  }
}
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const token = readCookie(req, SESSION_COOKIE),
      initial = token ? await staffSession(token) : null;
    if (!initial || !token) return failure();
    if (!(await staffThrottle(`mfa:${initial.adminId}`, 8)))
      return apiError(
        "rate_limited",
        "Too many attempts. Wait 15 minutes, then sign in again.",
        429,
      );
    // Empty enroll code is an explicit setup request; later submission proves possession.
    const setupSchema = z.object({ action: z.literal("setup") }).strict();
    const raw = await req.json();
    if (setupSchema.safeParse(raw).success) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "AdminUser" WHERE "id"=${initial.adminId} FOR UPDATE`;
        const s = await staffSession(token, tx);
        if (!s || s.admin.mfaConfirmedAt || s.admin.mustChangePassword)
          return null;
        let secret = s.admin.mfaSecretEncrypted
          ? decryptMfa(s.admin.mfaSecretEncrypted, s.adminId)
          : null;
        if (!secret) {
          secret = authenticator().secret.base32;
          await tx.adminUser.update({
            where: { id: s.adminId },
            data: { mfaSecretEncrypted: encryptMfa(secret, s.adminId) },
          });
        }
        return {
          setupKey: secret,
          uri: authenticator(secret, s.admin.email).toString(),
        };
      });
      return result
        ? apiOk(result, { headers: { "Cache-Control": "private, no-store" } })
        : failure();
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success)
      return apiError(
        "validation_error",
        "Check the requested action and fields.",
        400,
      );
    const d = parsed.data;
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "AdminUser" WHERE "id"=${initial.adminId} FOR UPDATE`;
        const s = await staffSession(token, tx);
        if (!s) return null;
        if (d.action === "password") {
          if (
            (!s.admin.mustChangePassword && !s.mfaVerifiedAt) ||
            d.currentPassword === d.newPassword ||
            !(await bcrypt.compare(d.currentPassword, s.admin.passwordHash))
          )
            return null;
          await tx.adminUser.update({
            where: { id: s.adminId },
            data: {
              passwordHash: await bcrypt.hash(d.newPassword, 12),
              mustChangePassword: false,
            },
          });
          await tx.adminSession.updateMany({
            where: { adminId: s.adminId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          await tx.auditLog.create({
            data: {
              adminId: s.adminId,
              action: "STAFF_PASSWORD_CHANGED",
              entity: "AdminUser",
              entityId: s.adminId,
            },
          });
          return {
            token: await createStaffSession(tx, s.adminId),
            nextStep: s.admin.mfaConfirmedAt ? "verify" : "enroll",
            recoveryCodes: undefined,
          };
        }
        if (s.admin.mustChangePassword || !s.admin.mfaSecretEncrypted)
          return null;
        if (
          d.action === "enroll"
            ? !!s.admin.mfaConfirmedAt
            : !s.admin.mfaConfirmedAt
        )
          return null;
        if (d.action === "regenerate" && !s.mfaVerifiedAt) return null;
        if (d.action === "recover") {
          const used = await tx.staffRecoveryCode.updateMany({
            where: {
              adminId: s.adminId,
              codeHash: recoveryHash(s.adminId, d.code),
              usedAt: null,
            },
            data: { usedAt: new Date() },
          });
          if (used.count !== 1) return null;
        } else {
          if (!/^\d{6}$/.test(d.code)) return null;
          const totp = authenticator(
              decryptMfa(s.admin.mfaSecretEncrypted, s.adminId),
            ),
            now = Date.now(),
            delta = totp.validate({ token: d.code, timestamp: now, window: 1 });
          if (delta === null) return null;
          const step = BigInt(Math.floor(now / 30_000) + delta);
          if (s.admin.mfaLastStep !== null && step <= s.admin.mfaLastStep)
            return null;
          await tx.adminUser.update({
            where: { id: s.adminId },
            data: {
              mfaLastStep: step,
              ...(d.action === "enroll" ? { mfaConfirmedAt: new Date() } : {}),
            },
          });
        }
        let recoveryCodes: string[] | undefined;
        if (["enroll", "regenerate"].includes(d.action)) {
          recoveryCodes = newRecoveryCodes();
          await tx.staffRecoveryCode.deleteMany({
            where: { adminId: s.adminId },
          });
          await tx.staffRecoveryCode.createMany({
            data: recoveryCodes.map((code) => ({
              adminId: s.adminId,
              codeHash: recoveryHash(s.adminId, code),
            })),
          });
        }
        await tx.adminSession.updateMany({
          where: { id: s.id },
          data: { revokedAt: new Date() },
        });
        const memberships = await tx.staffMembership.findMany({
          where: {
            adminId: s.adminId,
            isActive: true,
            revokedAt: null,
            program: { isActive: true, organization: { isActive: true } },
          },
          select: { programId: true },
        });
        await tx.auditLog.create({
          data: {
            adminId: s.adminId,
            action: `STAFF_MFA_${d.action.toUpperCase()}`,
            entity: "AdminUser",
            entityId: s.adminId,
          },
        });
        const programId =
          memberships.length === 1 ? memberships[0].programId : null;
        return {
          token: await createStaffSession(tx, s.adminId, true, programId),
          nextStep: programId ? "ready" : "program",
          recoveryCodes,
        };
      },
      { timeout: 15000 },
    );
    if (!result) return failure();
    const res = apiOk(
      { nextStep: result.nextStep, recoveryCodes: result.recoveryCodes },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    writeStaffCookie(res, result.token);
    return res;
  } catch {
    return apiError(
      "service_unavailable",
      "MFA could not be confirmed. Retry or contact your verified platform operator; no reset message was sent.",
      503,
    );
  }
}
