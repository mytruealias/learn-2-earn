import { NextResponse } from "next/server";
import { getAdminSession, SESSION_COOKIE } from "@/lib/admin-auth";

export async function GET() {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, admin });
  } catch (error) {
    console.error("Admin session error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ ok: true });
    const rootDomain = process.env.ROOT_DOMAIN;
    // The domain attribute on cookie deletion MUST match the one used at
    // login time, otherwise the browser will not remove the cookie.
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
      ...(rootDomain && { domain: `admin.${rootDomain}` }),
    });
    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
