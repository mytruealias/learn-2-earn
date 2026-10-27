import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { readCookie } from "./request-cookie";
export { readCookie } from "./request-cookie";
import {
  SESSION_SECONDS,
  USER_COOKIE,
  parseSessionPayload,
} from "./session-policy";

function secret() {
  // An invitation code is shared; it must never be a signing key.
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("Configure SESSION_SECRET for learner sessions.");
  return value;
}

function verified(token: string) {
  try {
    const [encoded, signature, extra] = token.split(".");
    if (
      extra ||
      !encoded ||
      signature?.length !== 64 ||
      !/^[a-f0-9]{64}$/.test(signature)
    )
      return null;
    const payload = Buffer.from(encoded, "base64").toString("utf8");
    const expected = createHmac("sha256", secret()).update(payload).digest();
    if (!timingSafeEqual(Buffer.from(signature, "hex"), expected)) return null;
    return parseSessionPayload(payload);
  } catch {
    return null;
  }
}
function tokenHash(token: string) {
  // Equivalent base64 encodings must share a legacy revocation tombstone.
  const [encoded, signature] = token.split(".");
  const canonical = `${Buffer.from(encoded, "base64").toString("base64url")}.${signature}`;
  return createHash("sha256").update(canonical).digest("hex");
}

/** Check revocation, expiry and active account in PostgreSQL after verifying the signature. */
export async function getUserIdFromRequest(
  req: Request,
  db: Prisma.TransactionClient = prisma,
): Promise<string | null> {
  const token = readCookie(req, USER_COOKIE);
  const payload = token && verified(token);
  if (!token || !payload) return null;
  const hash = tokenHash(token);
  let session = await db.learnerSession.findUnique({
    where: { tokenHash: hash },
    include: { user: { select: { isActive: true } } },
  });
  if (payload.legacy) {
    // Retain proven guest progress. Old registered sessions require password re-entry
    // because the old public bootstrap could mint sessions for arbitrary accounts.
    const guest = await db.user.findUnique({
      where: { id: payload.id },
      select: { email: true, passwordHash: true, isActive: true },
    });
    if (!guest || guest.email || guest.passwordHash || !guest.isActive)
      return null;
    session =
      session ||
      (await db.learnerSession.upsert({
        where: { tokenHash: hash },
        update: {},
        create: {
          tokenHash: hash,
          userId: payload.id,
          expiresAt: new Date(payload.issuedAt + SESSION_SECONDS * 1000),
        },
        include: { user: { select: { isActive: true } } },
      }));
  }
  return session &&
    session.userId === payload.id &&
    session.user.isActive &&
    !session.revokedAt &&
    session.expiresAt.getTime() > Date.now()
    ? session.userId
    : null;
}
export async function createUserSession(
  userId: string,
  db: Prisma.TransactionClient = prisma,
) {
  const now = Date.now();
  const payload = `user:${userId}:${now}:${randomBytes(32).toString("hex")}`;
  const token = `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256", secret()).update(payload).digest("hex")}`;
  await db.learnerSession.create({
    data: {
      tokenHash: tokenHash(token),
      userId,
      expiresAt: new Date(now + SESSION_SECONDS * 1000),
    },
  });
  return token;
}
export function writeUserSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
}
export async function setUserSessionCookie(res: NextResponse, userId: string) {
  writeUserSessionCookie(res, await createUserSession(userId));
}
export async function revokeUserSession(req: Request) {
  const token = readCookie(req, USER_COOKIE);
  const payload = token && verified(token);
  if (!token || !payload) return;
  // Materialize a guest legacy session first so a tombstone cannot be bypassed.
  await getUserIdFromRequest(req);
  await prisma.learnerSession.updateMany({
    where: { tokenHash: tokenHash(token) },
    data: { revokedAt: new Date() },
  });
}
export function clearLearnerCookies(res: NextResponse) {
  for (const name of [USER_COOKIE, "l2e_demo_access"]) {
    res.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }
  if (process.env.ROOT_DOMAIN)
    res.cookies.set("l2e_demo_access", "", {
      domain: `app.${process.env.ROOT_DOMAIN}`,
      path: "/",
      maxAge: 0,
    });
}
export function sameOriginError(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return null; // Non-browser clients still need credentials/invitation.
  try {
    // Next/Replit may expose an internal URL behind the incoming Host/TLS proxy.
    const url = new URL(req.url);
    const scheme =
      req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
      url.protocol.slice(0, -1);
    if (!["http", "https"].includes(scheme))
      throw new Error("Invalid protocol");
    const expected = new URL(
      `${scheme}://${req.headers.get("host") || url.host}`,
    ).origin;
    if (origin === expected) return null;
  } catch {
    /* Invalid origin/host fails closed. */
  }
  return NextResponse.json(
    {
      error: {
        code: "forbidden",
        message: "Open this page directly to continue.",
      },
    },
    { status: 403 },
  );
}
