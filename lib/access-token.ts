import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { readCookie } from "./request-cookie";
import { SESSION_SECONDS } from "./session-policy";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("Configure SESSION_SECRET for program access.");
  return value;
}
export function createAccessToken(): string {
  const payload = `demo-access:${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256", secret()).update(payload).digest("hex")}`;
}
export function setDemoAccessCookie(res: NextResponse): void {
  const rootDomain = process.env.ROOT_DOMAIN;
  res.cookies.set("l2e_demo_access", createAccessToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
    path: "/",
    ...(rootDomain && { domain: `app.${rootDomain}` }),
  });
}
export function verifyAccessToken(token: string): boolean {
  try {
    const [encoded, signature, extra] = token.split(".");
    if (
      extra ||
      !encoded ||
      signature?.length !== 64 ||
      !/^[a-f0-9]{64}$/.test(signature)
    )
      return false;
    const payload = Buffer.from(encoded, "base64").toString("utf8");
    if (!/^demo-access:\d{13}$/.test(payload)) return false;
    if (
      !timingSafeEqual(
        Buffer.from(signature, "hex"),
        createHmac("sha256", secret()).update(payload).digest(),
      )
    )
      return false;
    const timestamp = Number(payload.slice("demo-access:".length));
    return (
      timestamp <= Date.now() + 60_000 &&
      Date.now() - timestamp < SESSION_SECONDS * 1000
    );
  } catch {
    return false;
  }
}
export function hasProgramAccess(req: Request): boolean {
  const token = readCookie(req, "l2e_demo_access");
  return !!token && verifyAccessToken(token);
}
