import { NextResponse } from "next/server";
import { setCityAccessCookie, getExpectedPin, getCityAccess, type CitySlug } from "@/lib/city-access";

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const citySlug = slug as CitySlug;
    if (!getCityAccess(citySlug)) {
      return NextResponse.json({ error: "Unknown city" }, { status: 404 });
    }

    const body = await req.json();
    const { pin } = body ?? {};

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const expected = getExpectedPin(citySlug);
    if (!expected) {
      return NextResponse.json(
        { error: "City access gate is not configured" },
        { status: 503 },
      );
    }
    if (pin.trim() !== expected) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    setCityAccessCookie(response, citySlug);
    return response;
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
