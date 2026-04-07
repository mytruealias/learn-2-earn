import { createHmac } from "crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "l2e_user_session";
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.DEMO_ACCESS_CODE;
  if (!secret) {
    throw new Error("SESSION_SECRET or DEMO_ACCESS_CODE must be set");
  }
  return secret;
}

function signUserId(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${sig}`;
}

function verifyToken(token: string): string | null {
  try {
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return null;
    const encodedPayload = token.slice(0, dotIndex);
    const sig = token.slice(dotIndex + 1);
    const payload = Buffer.from(encodedPayload, "base64").toString("utf8");
    const expectedSig = createHmac("sha256", getSecret()).update(payload).digest("hex");
    if (sig !== expectedSig) return null;
    const userId = payload.split(":")[0];
    return userId || null;
  } catch {
    return null;
  }
}

export function setUserSessionCookie(res: NextResponse, userId: string): void {
  res.cookies.set(COOKIE_NAME, signUserId(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: THIRTY_DAYS_SECONDS,
    path: "/",
  });
}

export function getUserIdFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const token = match.slice(COOKIE_NAME.length + 1);
  return verifyToken(token);
}
