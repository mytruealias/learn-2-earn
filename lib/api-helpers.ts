import { readRequestJson } from "./reliability/read-json";
import { ScopeError } from "./scope-error";
import { NextResponse } from "next/server";
import { z, type ZodTypeAny } from "zod";
import { headers as requestHeaders } from "next/headers";
import { REQUEST_ID_HEADER, requestIdFrom } from "./reliability/correlation";
import { operationalEvent } from "./reliability/events";
import { RateStoreUnavailable } from "./reliability/rate-limit";

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
  options?: {
    fields?: Record<string, string[]>;
    headers?: Record<string, string>;
    requestId?: string;
  },
): NextResponse {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(options?.fields ? { fields: options.fields } : {}),
    },
    ...(options?.requestId ? { requestId: options.requestId } : {}),
  };
  return NextResponse.json(body, { status, headers: options?.headers });
}

/**
 * Successful response. Always includes `ok: true` so older clients reading
 * `data.ok` keep working. New code should read the named keys directly.
 */
export function apiOk<T extends Record<string, unknown>>(
  data?: T,
  init?: ResponseInit,
): NextResponse {
  return NextResponse.json({ ok: true, ...(data ?? {}) }, init);
}

/**
 * Generic failure handler. Logs only allowlisted metadata and returns a safe,
 * generic message + a short request ID the user can quote in support.
 */
export async function apiServerError(label: string, error: unknown): Promise<NextResponse> {
  if (error instanceof ScopeError)
    return apiError(
      error.status === 404 ? "not_found" : "forbidden",
      error.message,
      error.status,
    );
  const requestId = await failureReference(label);
  if (error instanceof RateStoreUnavailable) return apiError("service_unavailable", "The shared access service is unavailable. No access or save is confirmed. Try again later.", 503, { requestId, headers: { [REQUEST_ID_HEADER]: requestId, "Cache-Control": "private, no-store", "Retry-After": "30" } });
  return apiError(
    "internal_error",
    "Something went wrong on our side. Please try again in a moment.",
    500,
    { requestId, headers: { [REQUEST_ID_HEADER]: requestId, "Cache-Control": "private, no-store" } },
  );
}

/** One opaque reference across API responses and the server operational channel. */
export async function failureReference(label: string) {
  let incoming: string | null = null;
  try { incoming = (await requestHeaders()).get(REQUEST_ID_HEADER); } catch { /* Direct contracts have no request context. */ }
  return operationalEvent("api_failure", requestIdFrom(incoming), label);
}
export async function apiUnavailable(label: string, message: string) {
  const requestId = await failureReference(label);
  return apiError("service_unavailable", message, 503, { requestId, headers: { [REQUEST_ID_HEADER]: requestId, "Cache-Control": "private, no-store", "Retry-After": "30" } });
}

/**
 * Parse + validate JSON body in one step. On failure, returns a
 * NextResponse that the caller MUST return directly.
 */
export async function parseJson<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<
  { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }
> {
  const body = await readRequestJson(req, 65536, false);
  if (!body.ok) return { ok: false, response: apiError(body.error.code, body.error.message, body.error.status) };
  const raw = body.data;

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
export const idParamSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9_-]+$/, "ID must be alphanumeric, dashes, or underscores");

/** Reusable schema for short slugs (city slugs, etc.). */
export const slugParamSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or dashes");

export function parseQuery<S extends ZodTypeAny>(
  raw: Record<string, string | undefined>,
  schema: S,
): { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, response: zodErrorResponse(parsed.error) };
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

export function rateLimitResponse(
  retryAfterSec: number,
  message?: string,
): NextResponse {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return apiError(
    "rate_limited",
    message ??
      `Too many requests. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    429,
    { headers: { "Retry-After": String(retryAfterSec) } },
  );
}
