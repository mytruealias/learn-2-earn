import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/app", "/paths", "/lesson", "/profile", "/lifeline", "/signup"];

async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [encodedPayload, signature] = parts;
    const payload = atob(encodedPayload);

    if (!payload.startsWith("demo-access:")) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSig) return false;

    const timestamp = parseInt(payload.split(":")[1], 10);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > thirtyDaysMs) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("l2e_demo_access")?.value;
  if (accessToken) {
    const secret = process.env.SESSION_SECRET || process.env.DEMO_ACCESS_CODE || "l2e-fallback-secret";
    const valid = await verifyToken(accessToken, secret);
    if (valid) {
      return NextResponse.next();
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/app/:path*",
    "/paths/:path*",
    "/lesson/:path*",
    "/profile/:path*",
    "/lifeline/:path*",
    "/signup/:path*",
  ],
};
