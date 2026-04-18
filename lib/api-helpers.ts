import { NextResponse } from "next/server";
import { z, type ZodTypeAny } from "zod";
import crypto from "crypto";

/**
 * Standard error envelope used by every API route in the project:
 *
 *   { error: { code, message, fields? }, requestId? }
 *
 * `code`     short machine-readable identifier (e.g. "validation_error")
 * `message`  user-safe human-readable string (never echoes raw exceptions)
 * `fields`   optional per-field validation errors for forms
 * `requestId` only present on 5xx so support can correlate logs
 */
export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string[]> };
  requestId?: string;
}

export type ApiErrorCode =
  | "validation_error"
  | "invalid_json"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "bad_request"
  | "service_unavailable"
  | "internal_error"
  | "signup_required";

export function apiError(
  code: ApiErrorCode | string,
  message: string,
  status: number,
  options?: { fields?: Record<string, string[]>; headers?: Record<string, string>; requestId?: string },
): NextResponse {
  const body: ApiErrorBody = {
    error: { code, message, ...(options?.fields ? { fields: options.fields } : {}) },
    ...(options?.requestId ? { requestId: options.requestId } : {}),
  };
  return NextResponse.json(body, { status, headers: options?.headers });
}

/**
 * Successful response. Always includes `ok: true` so older clients reading
 * `data.ok` keep working. New code should read the named keys directly.
 */
export function apiOk<T extends Record<string, unknown>>(data?: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, ...(data ?? {}) }, init);
}

/**
 * Generic 500 handler. Logs the real error server-side and returns a safe,
 * generic message + a short request ID the user can quote in support.
 */
export function apiServerError(label: string, error: unknown): NextResponse {
  const requestId = crypto.randomBytes(6).toString("hex");
  console.error(`[${label}] requestId=${requestId}`, error);
  return apiError(
    "internal_error",
    "Something went wrong on our side. Please try again in a moment.",
    500,
    { requestId },
  );
}

/**
 * Parse + validate JSON body in one step. On failure, returns a
 * NextResponse that the caller MUST return directly.
 */
export async function parseJson<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: apiError("invalid_json", "Request body must be valid JSON.", 400) };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, response: zodErrorResponse(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Validate query string / URL params. Caller supplies a plain object built
 * from `URLSearchParams.entries()` (or `Object.fromEntries(url.searchParams)`).
 */
/**
 * Validate a single dynamic path segment (e.g. [userId], [id], [slug]) with a
 * zod schema. Returns the parsed value or a 400 response. Use this for every
 * dynamic route segment so malformed/over-long IDs get rejected before they
 * hit the database.
 */
export function parseParam<S extends ZodTypeAny>(
  raw: unknown,
  schema: S,
  paramName = "param",
): { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiError(
        "validation_error",
        parsed.error.issues[0]?.message ?? `Invalid ${paramName}`,
        400,
        { fields: { [paramName]: parsed.error.issues.map((i) => i.message) } },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

/** Reusable schema for opaque ID-like path segments. */
export const idParamSchema = z.string().trim().min(1).max(120).regex(
  /^[a-zA-Z0-9_-]+$/,
  "ID must be alphanumeric, dashes, or underscores",
);

/** Reusable schema for short slugs (city slugs, etc.). */
export const slugParamSchema = z.string().trim().min(1).max(60).regex(
  /^[a-z0-9-]+$/,
  "Slug must be lowercase letters, numbers, or dashes",
);

export function parseQuery<S extends ZodTypeAny>(
  raw: Record<string, string | undefined>,
  schema: S,
): { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, response: zodErrorResponse(parsed.error) };
  return { ok: true, data: parsed.data };
}

function zodErrorResponse(error: z.ZodError): NextResponse {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!fields[key]) fields[key] = [];
    fields[key].push(issue.message);
  }
  const firstMessage = error.issues[0]?.message ?? "Invalid request.";
  return apiError("validation_error", firstMessage, 400, { fields });
}

// ── Client IP + rate limiter ────────────────────────────────────────────────

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

interface RateBucket {
  count: number;
  resetAt: number;
}

export interface RateLimiter {
  check(key: string): { allowed: boolean; retryAfterSec: number };
  record(key: string): void;
  reset(key: string): void;
}

/**
 * Simple in-memory sliding-window rate limiter. Suitable for single-instance
 * deploys. Each call site owns its own bucket map so limits don't collide.
 */
export function createRateLimiter({
  max,
  windowMs,
}: {
  max: number;
  windowMs: number;
}): RateLimiter {
  const buckets = new Map<string, RateBucket>();

  return {
    check(key) {
      const now = Date.now();
      const entry = buckets.get(key);
      if (!entry || now > entry.resetAt) return { allowed: true, retryAfterSec: 0 };
      if (entry.count >= max) {
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
      }
      return { allowed: true, retryAfterSec: 0 };
    },
    record(key) {
      const now = Date.now();
      const entry = buckets.get(key);
      if (!entry || now > entry.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return;
      }
      entry.count++;
    },
    reset(key) {
      buckets.delete(key);
    },
  };
}

export function rateLimitResponse(retryAfterSec: number, message?: string): NextResponse {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return apiError(
    "rate_limited",
    message ?? `Too many requests. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    429,
    { headers: { "Retry-After": String(retryAfterSec) } },
  );
}
