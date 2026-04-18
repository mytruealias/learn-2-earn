import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, parseParam, idParamSchema, getClientIp } from "@/lib/api-helpers";

const Schema = z.object({
  staffId: z.string().min(1, "staffId is required").max(120),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const { id: rawId } = await params;
    const idCheck = parseParam(rawId, idParamSchema, "id");
    if (!idCheck.ok) return idCheck.response;
    const id = idCheck.data;

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const { staffId, notes } = parsed.data;

    const [existing, staff] = await Promise.all([
      prisma.case.findUnique({ where: { id } }),
      prisma.adminUser.findUnique({ where: { id: staffId } }),
    ]);

    if (!existing) return apiError("not_found", "Case not found", 404);
    if (!staff) return apiError("not_found", "Staff member not found", 404);

    const [updatedCase] = await Promise.all([
      prisma.case.update({
        where: { id },
        data: { status: "dispatched", assignedToId: staffId },
      }),
      prisma.caseNote.create({
        data: {
          caseId: id,
          adminId: admin.id,
          type: "dispatch",
          text: `Dispatched ${staff.fullName} to this case.${notes ? ` Notes: ${notes}` : ""}`,
        },
      }),
    ]);

    await logAudit({
      adminId: admin.id,
      action: "CASE_DISPATCH",
      entity: "Case",
      entityId: id,
      details: JSON.stringify({ staffId, staffName: staff.fullName, notes }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ case: updatedCase });
  } catch (error) {
    return apiServerError("admin/cases/dispatch", error);
  }
}
