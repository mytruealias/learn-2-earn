import { NextResponse } from "next/server";
import { adminLogin, SESSION_COOKIE } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const result = await adminLogin(email, password);

    if (!result.success) {
      await logAudit({
        action: "LOGIN_FAILED",
        entity: "AdminUser",
        details: JSON.stringify({ email, reason: result.error }),
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await logAudit({
      adminId: result.admin!.id,
      action: "LOGIN_SUCCESS",
      entity: "AdminUser",
      entityId: result.admin!.id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json({ ok: true, admin: result.admin });
    const rootDomain = process.env.ROOT_DOMAIN;
    response.cookies.set(SESSION_COOKIE, result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
      // Scope to admin subdomain in production so the session cookie is
      // never sent to app.learn2earn.org or learn2earn.org.
      ...(rootDomain && { domain: `admin.${rootDomain}` }),
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
