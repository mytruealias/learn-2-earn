import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, getClientIp } from "@/lib/api-helpers";

const Schema = z.object({
  text: z.string().trim().min(1, "Note text is required").max(5000),
  type: z.string().max(40).optional().default("note"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const { id } = await params;
    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const { text, type } = parsed.data;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return apiError("not_found", "Case not found", 404);

    const note = await prisma.caseNote.create({
      data: { caseId: id, adminId: admin.id, text, type },
      include: { admin: { select: { id: true, fullName: true, role: true } } },
    });

    await logAudit({
      adminId: admin.id,
      action: "CASE_NOTE_ADD",
      entity: "Case",
      entityId: id,
      details: JSON.stringify({ noteType: type, noteLength: text.length }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ note });
  } catch (error) {
    return apiServerError("admin/cases/notes", error);
  }
}
