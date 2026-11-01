import { NextResponse } from "next/server";
export function sameOriginError(req: Request) {
  if (req.headers.get("sec-fetch-site") === "cross-site")
    return NextResponse.json(
      {
        error: {
          code: "forbidden",
          message: "Open this page directly to continue.",
        },
      },
      { status: 403 },
    );
  const origin = req.headers.get("origin");
  if (!origin) return null; // Non-browser clients still need credentials/invitation.
  try {
    // Next/Replit may expose an internal URL behind the incoming Host/TLS proxy.
    const url = new URL(req.url);
    const scheme =
      req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
      url.protocol.slice(0, -1);
    if (!["http", "https"].includes(scheme))
      throw new Error("Invalid protocol");
    const expected = new URL(
      `${scheme}://${req.headers.get("host") || url.host}`,
    ).origin;
    if (origin === expected) return null;
  } catch {
    /* Invalid origin/host fails closed. */
  }
  return NextResponse.json(
    {
      error: {
        code: "forbidden",
        message: "Open this page directly to continue.",
      },
    },
    { status: 403 },
  );
}
