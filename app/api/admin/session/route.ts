import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getAdminSessionFromToken, SESSION_COOKIE } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    let admin = await getAdminSession();

    if (!admin) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        admin = await getAdminSessionFromToken(token);
      }
    }

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
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
