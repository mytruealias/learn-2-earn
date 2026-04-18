import { createHmac } from "crypto";
import { NextResponse } from "next/server";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type CitySlug = "austin" | "los-angeles" | "dallas" | "denver" | "houston";

interface CityAccessSpec {
  cookieName: string;
  tokenPrefix: string;
  pinEnvVar: string;
}

const CITY_ACCESS: Record<CitySlug, CityAccessSpec> = {
  "austin": {
    cookieName: "l2e_austin_access",
    tokenPrefix: "austin-access:",
    pinEnvVar: "AUSTIN_ACCESS_PIN",
  },
  "los-angeles": {
    cookieName: "l2e_los-angeles_access",
    tokenPrefix: "los-angeles-access:",
    pinEnvVar: "CITY_ACCESS_PIN",
  },
  "dallas": {
    cookieName: "l2e_dallas_access",
    tokenPrefix: "dallas-access:",
    pinEnvVar: "CITY_ACCESS_PIN",
  },
  "denver": {
    cookieName: "l2e_denver_access",
    tokenPrefix: "denver-access:",
    pinEnvVar: "CITY_ACCESS_PIN",
  },
  "houston": {
    cookieName: "l2e_houston_access",
    tokenPrefix: "houston-access:",
    pinEnvVar: "CITY_ACCESS_PIN",
  },
};

export function getCityAccess(slug: CitySlug): CityAccessSpec | null {
  return CITY_ACCESS[slug] ?? null;
}

function requireSecret(spec: CityAccessSpec): string {
  const sessionSecret = process.env.SESSION_SECRET;
  const pin = process.env[spec.pinEnvVar];
  const secret = sessionSecret || pin;
  if (!secret) {
    throw new Error(
      `City access gate is not configured: missing SESSION_SECRET and ${spec.pinEnvVar}`
    );
  }
  return secret;
}

export function getExpectedPin(slug: CitySlug): string | null {
  const spec = CITY_ACCESS[slug];
  if (!spec) return null;
  const pin = process.env[spec.pinEnvVar];
  if (!pin) return null;
  return pin.trim();
}

export function createCityToken(slug: CitySlug): string {
  const spec = CITY_ACCESS[slug];
  if (!spec) throw new Error(`Unknown city slug: ${slug}`);
  const secret = requireSecret(spec);
  const payload = `${spec.tokenPrefix}${Date.now()}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${signature}`;
}

export function setCityAccessCookie(res: NextResponse, slug: CitySlug): void {
  const spec = CITY_ACCESS[slug];
  if (!spec) return;
  const token = createCityToken(slug);
  res.cookies.set(spec.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function verifyCityToken(slug: CitySlug, token: string): boolean {
  const spec = CITY_ACCESS[slug];
  if (!spec) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [encodedPayload, signature] = parts;
    const payload = Buffer.from(encodedPayload, "base64").toString();
    if (!payload.startsWith(spec.tokenPrefix)) return false;

    const secret = requireSecret(spec);
    const expectedSig = createHmac("sha256", secret).update(payload).digest("hex");
    if (signature !== expectedSig) return false;

    const timestamp = parseInt(payload.slice(spec.tokenPrefix.length), 10);
    if (!Number.isFinite(timestamp)) return false;
    if (Date.now() - timestamp > THIRTY_DAYS_MS) return false;
    return true;
  } catch {
    return false;
  }
}
