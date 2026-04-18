/**
 * Helpers for invoking Next.js route handlers directly with mock Requests.
 * No HTTP server is started — the handler is called like a regular function.
 */

interface MakeRequestOpts {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  ip?: string;
}

export function makeRequest(url: string, opts: MakeRequestOpts = {}): Request {
  const headers = new Headers(opts.headers ?? {});
  if (opts.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (opts.cookies && Object.keys(opts.cookies).length > 0) {
    const cookieStr = Object.entries(opts.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    headers.set("cookie", cookieStr);
  }
  if (opts.ip) {
    headers.set("x-forwarded-for", opts.ip);
  }
  const init: RequestInit = {
    method: opts.method ?? "POST",
    headers,
  };
  if (opts.body !== undefined) {
    init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }
  return new Request(url, init);
}

export async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Extract Set-Cookie header values from a Response. */
export function getSetCookies(res: Response): string[] {
  const all: string[] = [];
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") all.push(value);
  });
  return all;
}

/** Pull a single cookie value from a list of Set-Cookie strings. */
export function readCookie(setCookies: string[], name: string): string | null {
  for (const c of setCookies) {
    const [pair] = c.split(";");
    const [k, v] = pair.split("=");
    if (k.trim() === name) return v;
  }
  return null;
}
