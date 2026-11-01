import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { TOTP, Secret } from "otpauth";
import type { Prisma } from "@prisma/client";
import prisma from "./prisma";
export const STAFF_ABSOLUTE_MS = 8 * 60 * 60_000;
export const STAFF_IDLE_MS = 30 * 60_000;
export const STAFF_CHALLENGE_MS = 10 * 60_000;
export function staffTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
function key() {
  const value = process.env.STAFF_MFA_ENCRYPTION_KEY;
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value))
    throw new Error("Staff MFA encryption is not configured.");
  return Buffer.from(value, "hex");
}
export function encryptMfa(secret: string, adminId: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(`l2e-staff-mfa-v1:${adminId}`));
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}
export function decryptMfa(value: string, adminId: string) {
  const [version, iv, tag, data] = value.split(":");
  if (version !== "v1") throw new Error("Unsupported MFA key version.");
  const cipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "hex"));
  cipher.setAAD(Buffer.from(`l2e-staff-mfa-v1:${adminId}`));
  cipher.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([
    cipher.update(Buffer.from(data, "hex")),
    cipher.final(),
  ]).toString("utf8");
}
export function authenticator(secret?: string, label = "Staff account") {
  return new TOTP({
    issuer: "Learn2Earn staff",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret ? Secret.fromBase32(secret) : new Secret({ size: 20 }),
  });
}
export const recoveryHash = (adminId: string, code: string) =>
  staffTokenHash(`${adminId}:${code.trim().toUpperCase()}`);
export function newRecoveryCodes() {
  return Array.from({ length: 10 }, () =>
    randomBytes(12)
      .toString("hex")
      .toUpperCase()
      .match(/.{1,6}/g)!
      .join("-"),
  );
}

/** Persistent account/IP buckets; HMAC avoids storing raw IPs. No process-local bypass across workers. */
export async function staffThrottle(
  identity: string,
  max: number,
  tx?: Prisma.TransactionClient,
) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Session signing is not configured.");
  const id = createHmac("sha256", secret).update(identity).digest("hex");
  const work = async (db: Prisma.TransactionClient) => {
    await db.staffAuthThrottle.upsert({
      where: { key: id },
      create: { key: id },
      update: {},
    });
    await db.$queryRaw`SELECT "key" FROM "StaffAuthThrottle" WHERE "key"=${id} FOR UPDATE`;
    const row = await db.staffAuthThrottle.findUniqueOrThrow({
        where: { key: id },
      }),
      now = new Date();
    if (row.lockedUntil && row.lockedUntil > now) return false;
    const fresh = now.getTime() - row.windowAt.getTime() >= 15 * 60_000;
    const failures = fresh ? 1 : row.failures + 1;
    await db.staffAuthThrottle.update({
      where: { key: id },
      data: {
        failures,
        windowAt: fresh ? now : row.windowAt,
        lockedUntil:
          failures >= max ? new Date(now.getTime() + 15 * 60_000) : null,
      },
    });
    return failures <= max;
  };
  return tx ? work(tx) : prisma.$transaction(work);
}
