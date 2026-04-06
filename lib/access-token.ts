import { createHmac } from "crypto";
import { NextResponse } from "next/server";

const SECRET = process.env.SESSION_SECRET || process.env.DEMO_ACCESS_CODE || "l2e-fallback-secret";

export function createAccessToken(): string {
  const payload = `demo-access:${Date.now()}`;
  const signature = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${signature}`;
}

export function setDemoAccessCookie(res: NextResponse): void {
  const token = createAccessToken();
  const rootDomain = process.env.ROOT_DOMAIN;
  res.cookies.set("l2e_demo_access", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    ...(rootDomain && { domain: `app.${rootDomain}` }),
  });
}

export function verifyAccessToken(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [encodedPayload, signature] = parts;
    const payload = Buffer.from(encodedPayload, "base64").toString();

    if (!payload.startsWith("demo-access:")) return false;

    const expectedSig = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (signature !== expectedSig) return false;

    const timestamp = parseInt(payload.split(":")[1], 10);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > thirtyDaysMs) return false;

    return true;
  } catch {
    return false;
  }
}
