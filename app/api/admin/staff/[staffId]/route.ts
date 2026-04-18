import { z } from "zod";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, parseParam, idParamSchema, getClientIp } from "@/lib/api-helpers";

const PatchSchema = z.object({ isActive: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ staffId: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    if (!requireRole(admin.role, ["admin"])) return apiError("forbidden", "Admin role required", 403);

    const { staffId: rawStaffId } = await params;
    const idCheck = parseParam(rawStaffId, idParamSchema, "staffId");
    if (!idCheck.ok) return idCheck.response;
    const staffId = idCheck.data;

    const parsed = await parseJson(req, PatchSchema);
    if (!parsed.ok) return parsed.response;
    const { isActive } = parsed.data;

    if (staffId === admin.id) {
      return apiError("bad_request", "Cannot modify your own account", 400);
    }

    const target = await prisma.adminUser.findUnique({ where: { id: staffId } });
    if (!target) return apiError("not_found", "Staff member not found", 404);

    const updated = await prisma.adminUser.update({
      where: { id: staffId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    await logAudit({
      adminId: admin.id,
      action: isActive ? "STAFF_REACTIVATE" : "STAFF_DEACTIVATE",
      entity: "AdminUser",
      entityId: staffId,
      details: JSON.stringify({ email: target.email, isActive }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ staff: updated });
  } catch (error) {
    return apiServerError("admin/staff/patch", error);
  }
}
