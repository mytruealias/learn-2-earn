import { caseMutation } from "@/lib/staff/cases";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { scopedDb } from "@/lib/program-scope";
import {
  apiError,
  apiOk,
  apiServerError,
  parseParam,
  idParamSchema,
  getClientIp,
} from "@/lib/api-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    const prisma = scopedDb(admin);

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
          include: {
            admin: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        allocations: {
          include: { admin: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    });

    if (!c) return apiError("not_found", "Not found", 404);

    await logAudit({
      programId: admin.programId,
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return caseMutation(req, (await params).id, "meta");
}
