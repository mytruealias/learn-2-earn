import { NextResponse } from "next/server";
import { setAustinAccessCookie } from "@/lib/austin-access";

const AUSTIN_PIN = process.env.AUSTIN_ACCESS_PIN || "AUSTIN2026";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    if (pin.trim() !== AUSTIN_PIN.trim()) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    setAustinAccessCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
