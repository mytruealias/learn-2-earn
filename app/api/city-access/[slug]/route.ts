import { NextResponse } from "next/server";
import { setCityAccessCookie, getExpectedPin, getCityAccess, type CitySlug } from "@/lib/city-access";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000;

const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function isRateLimited(key: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    return { limited: false, retryAfterSec: 0 };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { limited: true, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  return { limited: false, retryAfterSec: 0 };
}

function recordFailure(key: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count++;
}

function clearFailures(key: string): void {
  failedAttempts.delete(key);
}

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

    const ip = getClientIp(req);
    const rateKey = `${ip}:${citySlug}`;

    const { limited, retryAfterSec } = isRateLimited(rateKey);
    if (limited) {
      const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
      return NextResponse.json(
        {
          error: `Too many incorrect PIN attempts. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        },
      );
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
      recordFailure(rateKey);
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    clearFailures(rateKey);
    const response = NextResponse.json({ ok: true });
    setCityAccessCookie(response, citySlug);
    return response;
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
