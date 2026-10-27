import { z } from "zod";
import prisma from "../prisma";
import { apiError, apiOk, parseJson } from "../api-helpers";
import { getUserIdFromRequest, sameOriginError } from "../user-session";
import { getAdminFromRequest } from "../admin-auth";
import { financialLock, RewardIssue, userLock, type Tx } from "./accounting";
export function rewardError(error: unknown) {
  if (error instanceof RewardIssue)
    return apiError(error.code, error.message, error.status);
  console.error(
    "[rewards] Operation failed; no partial financial write committed.",
  );
  return apiError(
    "service_unavailable",
    "This operation could not be confirmed. Retry with the same request; do not send another payment.",
    503,
  );
}
export async function learnerWrite<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
  work: (
    tx: Tx,
    id: string,
    data: z.infer<S>,
  ) => Promise<Record<string, unknown>>,
) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError(
        "unauthorized",
        "Sign in to view or request rewards.",
        401,
      );
    const parsed = await parseJson(req, schema);
    if (!parsed.ok) return parsed.response;
    const data = await prisma.$transaction(
      async (tx) => {
        await financialLock(tx);
        await userLock(tx, id);
        if ((await getUserIdFromRequest(req, tx)) !== id)
          throw new RewardIssue(
            "unauthorized",
            "Your session ended. Sign in to continue.",
            401,
          );
        return work(tx, id, parsed.data);
      },
      { maxWait: 15000, timeout: 20000 },
    );
    return apiOk(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return rewardError(e);
  }
}
export async function staffWrite<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
  roles: string[],
  work: (
    tx: Tx,
    admin: { id: string; role: string },
    data: z.infer<S>,
  ) => Promise<Record<string, unknown>>,
) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Sign in as staff.", 401);
    if (!roles.includes(admin.role))
      return apiError(
        "forbidden",
        "Your staff role cannot perform this action.",
        403,
      );
    const parsed = await parseJson(req, schema);
    if (!parsed.ok) return parsed.response;
    const data = await prisma.$transaction(
      async (tx) => {
        const current = await getAdminFromRequest(req, tx);
        if (!current || !roles.includes(current.role))
          throw new RewardIssue(
            "forbidden",
            "Your staff session or permissions changed.",
            403,
          );
        return work(tx, current, parsed.data);
      },
      { maxWait: 15000, timeout: 20000 },
    );
    return apiOk(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return rewardError(e);
  }
}
