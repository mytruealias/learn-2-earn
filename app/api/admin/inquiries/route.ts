import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { scopedDb } from "@/lib/program-scope";
import { apiError, apiOk, apiServerError, parseQuery } from "@/lib/api-helpers";
export async function GET(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (a.role !== "admin")
      return apiError(
        "forbidden",
        "Only the intake program’s authorized administrators can read partner inquiries.",
        403,
      );
    const p = parseQuery(
      Object.fromEntries(new URL(req.url).searchParams),
      z
        .object({ page: z.coerce.number().int().min(1).max(10000).default(1) })
        .strict(),
    );
    if (!p.ok) return p.response;
    const db = scopedDb(a),
      page = p.data.page;
    const [total, items] = await db.$transaction((tx) =>
      Promise.all([
        tx.partnerInquiry.count(),
        tx.partnerInquiry.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          take: 20,
          skip: (page - 1) * 20,
          select: {
            id: true,
            fullName: true,
            organization: true,
            email: true,
            interest: true,
            region: true,
            message: true,
            createdAt: true,
            noticeSnapshot: true,
          },
        }),
      ]),
    );
    return apiOk(
      { items, total, page, pages: Math.max(1, Math.ceil(total / 20)) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiServerError("admin/inquiries", e);
  }
}
