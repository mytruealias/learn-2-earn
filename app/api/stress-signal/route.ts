import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest, sameOriginError } from "@/lib/user-session";
import { apiError, apiOk, parseQuery } from "@/lib/api-helpers";
import { boundedJson } from "@/lib/support/bounded-json";
import {
  createSupportRequest,
  supportRequestSchema,
  supportReceipt,
} from "@/lib/support/intake";
import { RewardIssue } from "@/lib/rewards/accounting";
function supportError(e: unknown) {
  if (e instanceof RewardIssue) return apiError(e.code, e.message, e.status);
  return apiError(
    "service_unavailable",
    "The program request outcome could not be confirmed. Check its status or retry unchanged details with the same key. Public human-help resources remain available.",
    503,
  );
}
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const raw = await boundedJson(req, 12288);
    if (!raw.ok) return raw.response;
    const d = supportRequestSchema.safeParse(raw.data);
    if (!d.success)
      return apiError(
        "validation_error",
        "Add a short request, a request key and an explicit location-sharing choice. Location is optional.",
        400,
      );
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError(
        "unauthorized",
        "Sign in to request help from your program. Public human-help resources do not require sign-in.",
        401,
      );
    return apiOk(await createSupportRequest(req, id, d.data), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return supportError(e);
  }
}
export async function GET(req: Request) {
  try {
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError(
        "unauthorized",
        "Sign in to check your program request.",
        401,
      );
    const p = parseQuery(
      Object.fromEntries(new URL(req.url).searchParams),
      z.object({ requestKey: z.string().uuid() }).strict(),
    );
    if (!p.ok) return p.response;
    const c = await prisma.case.findUnique({
      where: { userId_intakeKey: { userId: id, intakeKey: p.data.requestKey } },
    });
    if (!c)
      return apiError(
        "not_found",
        "No saved request is confirmed for this key. If a save was interrupted, check again before starting another request.",
        404,
      );
    return apiOk(
      { receipt: supportReceipt(c) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return supportError(e);
  }
}
