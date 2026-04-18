import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, parseParam, idParamSchema, getClientIp } from "@/lib/api-helpers";

const PatchSchema = z.object({
  status: z.string().max(40).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  assignedToId: z.string().max(120).nullable().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const { id: rawId } = await params;
    const idCheck = parseParam(rawId, idParamSchema, "id");
    if (!idCheck.ok) return idCheck.response;
    const id = idCheck.data;

    const c = await prisma.case.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            caseNumber: true,
            city: true,
            state: true,
          },
        },
        assignedTo: { select: { id: true, fullName: true, role: true } },
        notes: {
          include: { admin: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        allocations: {
          include: { admin: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!c) return apiError("not_found", "Not found", 404);

    await logAudit({
      adminId: admin.id,
      action: "CASE_VIEW",
      entity: "Case",
      entityId: id,
      ipAddress: getClientIp(req),
    });

    return apiOk({ case: c });
  } catch (error) {
    return apiServerError("admin/cases/get", error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const { id: rawId } = await params;
    const idCheck = parseParam(rawId, idParamSchema, "id");
    if (!idCheck.ok) return idCheck.response;
    const id = idCheck.data;

    const parsed = await parseJson(req, PatchSchema);
    if (!parsed.ok) return parsed.response;
    const { status, priority, assignedToId } = parsed.data;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return apiError("not_found", "Not found", 404);

    const updated = await prisma.case.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      },
    });

    await logAudit({
      adminId: admin.id,
      action: "CASE_UPDATE",
      entity: "Case",
      entityId: id,
      details: JSON.stringify({ status, priority, assignedToId }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ case: updated });
  } catch (error) {
    return apiServerError("admin/cases/patch", error);
  }
}
