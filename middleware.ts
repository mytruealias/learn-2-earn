import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/app", "/paths", "/lesson", "/profile", "/lifeline", "/signup"];

const LEARNER_PATHS = [
  "/app", "/paths", "/lesson", "/profile",
  "/lifeline", "/signup", "/login", "/access",
];

async function verifyHmacToken(
  token: string,
  secret: string,
  prefix: string,
): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [encodedPayload, signature] = parts;
    const payload = atob(encodedPayload);

    if (!payload.startsWith(prefix)) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSig) return false;

    const timestamp = parseInt(payload.slice(prefix.length), 10);
    if (!Number.isFinite(timestamp)) return false;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > thirtyDaysMs) return false;

    return true;
  } catch {
    return false;
  }
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  return verifyHmacToken(token, secret, "demo-access:");
}

async function verifyAustinToken(token: string, secret: string): Promise<boolean> {
  return verifyHmacToken(token, secret, "austin-access:");
}

function redirect301(url: string): NextResponse {
  return NextResponse.redirect(url, { status: 301 });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const search = request.nextUrl.search;
  const rootDomain = process.env.ROOT_DOMAIN;

  // ── SUBDOMAIN ROUTING ──────────────────────────────────────────────────────
  // Only active when ROOT_DOMAIN env var is set (i.e. production with real
  // domains). Dev / Replit preview: all routes remain accessible as normal.
  if (rootDomain) {
    const hostname = (request.headers.get("host") || "").split(":")[0];

    // www → apex redirect
    if (hostname === `www.${rootDomain}`) {
      return redirect301(`https://${rootDomain}${pathname}${search}`);
    }

    const isRoot  = hostname === rootDomain;
    const isApp   = hostname === `app.${rootDomain}`;
    const isAdmin = hostname === `admin.${rootDomain}`;

    if (isRoot || isApp || isAdmin) {
      const isApiPath   = pathname.startsWith("/api/");
      const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
      const isLearnerPath = LEARNER_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
      const isAustinPagePath = pathname === "/austin" || pathname.startsWith("/austin/");
      const isRootPath = pathname === "/";

      // API routes always pass through — no subdomain restriction on the API layer
      if (!isApiPath) {
        if (isRoot) {
          // Root domain serves / and /austin (city-partnership deck with its own PIN gate)
          if (!isRootPath && !isAustinPagePath) {
            if (isAdminPath)   return redirect301(`https://admin.${rootDomain}${pathname}${search}`);
            if (isLearnerPath) return redirect301(`https://app.${rootDomain}${pathname}${search}`);
            return redirect301(`https://${rootDomain}/`);
          }
        } else if (isApp) {
          // App subdomain: learner routes only
          if (isRootPath)  return redirect301(`https://app.${rootDomain}/app`);
          if (isAdminPath) return redirect301(`https://admin.${rootDomain}${pathname}${search}`);
          if (isAustinPagePath) return redirect301(`https://${rootDomain}${pathname}${search}`);
          if (!isLearnerPath) return redirect301(`https://app.${rootDomain}/app`);
        } else if (isAdmin) {
          // Admin subdomain: admin routes only
          // Learner paths → route to the app subdomain (not trapped on admin)
          if (isRootPath)     return redirect301(`https://admin.${rootDomain}/admin`);
          if (isLearnerPath)  return redirect301(`https://app.${rootDomain}${pathname}${search}`);
          if (isAustinPagePath) return redirect301(`https://${rootDomain}${pathname}${search}`);
          if (!isAdminPath)   return redirect301(`https://admin.${rootDomain}/admin`);
        }
      }
    }
  }

  // ── AUSTIN PIN GATE ────────────────────────────────────────────────────────
  // The /austin pitch deck is sensitive and requires a PIN. Independent from
  // the learner demo gate: separate cookie, separate token prefix, separate
  // unlock page. /austin/unlock itself must stay reachable.
  const isAustinPath =
    (pathname === "/austin" || pathname.startsWith("/austin/")) &&
    pathname !== "/austin/unlock" &&
    !pathname.startsWith("/austin/unlock/");

  if (isAustinPath) {
    const austinToken = request.cookies.get("l2e_austin_access")?.value;
    let austinOk = false;
    if (austinToken) {
      const austinSecret =
        process.env.SESSION_SECRET ||
        process.env.AUSTIN_ACCESS_PIN ||
        "l2e-austin-fallback-secret";
      austinOk = await verifyAustinToken(austinToken, austinSecret);
    }
    if (!austinOk) {
      const url = request.nextUrl.clone();
      url.pathname = "/austin/unlock";
      url.search = "";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── DEMO ACCESS GATE ───────────────────────────────────────────────────────
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Allow through if they have a valid demo access token
  const accessToken = request.cookies.get("l2e_demo_access")?.value;
  if (accessToken) {
    const secret = process.env.SESSION_SECRET || process.env.DEMO_ACCESS_CODE || "l2e-fallback-secret";
    const valid = await verifyToken(accessToken, secret);
    if (valid) {
      return NextResponse.next();
    }
  }

  // Also allow through if they have a user session cookie (logged-in users)
  // This ensures registered users are never blocked by the demo gate.
  // The actual session validity is enforced on every API call.
  const userSession = request.cookies.get("l2e_user_session")?.value;
  if (userSession && userSession.length > 10) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Match all request paths EXCEPT:
  // - Next.js internals (_next/static, _next/image)
  // - Favicon
  // - Static file extensions (images, video, fonts, documents, data)
  // The subdomain logic is a strict no-op when ROOT_DOMAIN is absent.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mov|webm|pdf|txt|ico|woff|woff2|ttf|otf|eot|csv|xml|json)$).*)",
  ],
};
