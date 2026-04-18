import { NextResponse } from "next/server";
import { getAdminSession, SESSION_COOKIE } from "@/lib/admin-auth";
import { apiError, apiOk, apiServerError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return apiError("unauthorized", "Not signed in", 401);
    }
    return NextResponse.json({ ok: true, authenticated: true, admin });
  } catch (error) {
    return apiServerError("admin/session", error);
  }
}

export async function DELETE() {
  try {
    const response = apiOk();
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
    return apiServerError("admin/session/logout", error);
  }
}
