import { NextResponse } from "next/server";
import { createAccessToken } from "@/lib/access-token";

const DEMO_CODE = process.env.DEMO_ACCESS_CODE || "LEARN2EARN";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Access code is required" }, { status: 400 });
    }

    if (code.toUpperCase().trim() !== DEMO_CODE.toUpperCase().trim()) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
    }

    const token = createAccessToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set("l2e_demo_access", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
