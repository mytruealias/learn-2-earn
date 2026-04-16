import { createHmac } from "crypto";
import { NextResponse } from "next/server";

const SECRET = process.env.SESSION_SECRET || process.env.AUSTIN_ACCESS_PIN || "l2e-austin-fallback-secret";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_PREFIX = "austin-access:";

export function createAustinToken(): string {
  const payload = `${TOKEN_PREFIX}${Date.now()}`;
  const signature = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${signature}`;
}

export function setAustinAccessCookie(res: NextResponse): void {
  const token = createAustinToken();
  res.cookies.set("l2e_austin_access", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function verifyAustinToken(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [encodedPayload, signature] = parts;
    const payload = Buffer.from(encodedPayload, "base64").toString();

    if (!payload.startsWith(TOKEN_PREFIX)) return false;

    const expectedSig = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (signature !== expectedSig) return false;

    const timestamp = parseInt(payload.slice(TOKEN_PREFIX.length), 10);
    if (!Number.isFinite(timestamp)) return false;
    if (Date.now() - timestamp > THIRTY_DAYS_MS) return false;

    return true;
  } catch {
    return false;
  }
}
