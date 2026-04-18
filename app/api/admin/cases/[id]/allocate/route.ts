import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, parseParam, idParamSchema, getClientIp } from "@/lib/api-helpers";

const Schema = z.object({
  resourceType: z.string().min(1, "resourceType is required").max(60),
  quantity: z.coerce.number().int().min(1).max(1000).optional().default(1),
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
    const { resourceType, quantity, notes } = parsed.data;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return apiError("not_found", "Case not found", 404);

    const resourceLabels: Record<string, string> = {
      shelter: "Shelter referral",
      food: "Food bank referral",
      bus_pass: "Bus pass",
      hygiene: "Hygiene kit",
      clothing: "Clothing voucher",
      mental_health: "Mental health referral",
    };

    const label = resourceLabels[resourceType] || resourceType;
    const noteText = `Allocated: ${label} (qty: ${quantity}).${notes ? ` Notes: ${notes}` : ""}`;

    const [allocation] = await Promise.all([
      prisma.resourceAllocation.create({
        data: { caseId: id, adminId: admin.id, resourceType, quantity, notes: notes ?? null },
        include: { admin: { select: { id: true, fullName: true } } },
      }),
      prisma.caseNote.create({
        data: { caseId: id, adminId: admin.id, type: "resource", text: noteText },
      }),
    ]);

    await logAudit({
      adminId: admin.id,
      action: "CASE_RESOURCE_ALLOCATE",
      entity: "Case",
      entityId: id,
      details: JSON.stringify({ resourceType, quantity, notes }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ allocation });
  } catch (error) {
    return apiServerError("admin/cases/allocate", error);
  }
}
