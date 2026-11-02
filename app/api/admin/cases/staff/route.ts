import { getAdminFromRequest } from "@/lib/admin-auth";
import { scopedDb, legacyRole } from "@/lib/program-scope";
import { apiError, apiOk, apiServerError } from "@/lib/api-helpers";
export async function GET(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    const rows = await scopedDb(a).staffMembership.findMany({
      where: {
        isActive: true,
        revokedAt: null,
        role: { in: ["program_admin", "caseworker"] },
        admin: { isActive: true },
      },
      take: 200,
      orderBy: { admin: { fullName: "asc" } },
      select: { role: true, admin: { select: { id: true, fullName: true } } },
    });
    return apiOk({
      staff: rows.map((m) => ({ ...m.admin, role: legacyRole(m.role) })),
      limit: 200,
    });
  } catch (e) {
    return apiServerError("cases/staff", e);
  }
}
