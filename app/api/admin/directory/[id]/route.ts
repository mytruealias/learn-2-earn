import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiOk, apiServerError, parseJson, parseParam, idParamSchema, getClientIp, apiError } from "@/lib/api-helpers";

const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

const PatchSchema = z.object({
  name: optStr(200),
  category: optStr(60),
  address: optStr(500),
  phone: optStr(60),
  hours: optStr(200),
  notes: optStr(2000),
  website: optStr(500),
});

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
    const data = parsed.data;

    const entry = await prisma.serviceDirectory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.address !== undefined && { address: data.address ?? null }),
        ...(data.phone !== undefined && { phone: data.phone ?? null }),
        ...(data.hours !== undefined && { hours: data.hours ?? null }),
        ...(data.notes !== undefined && { notes: data.notes ?? null }),
        ...(data.website !== undefined && { website: data.website ?? null }),
      },
    });

    await logAudit({
      adminId: admin.id,
      action: "DIRECTORY_UPDATE",
      entity: "ServiceDirectory",
      entityId: id,
      details: JSON.stringify({ name: data.name }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ entry });
  } catch (error) {
    return apiServerError("admin/directory/patch", error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const { id: rawId } = await params;
    const idCheck = parseParam(rawId, idParamSchema, "id");
    if (!idCheck.ok) return idCheck.response;
    const id = idCheck.data;

    await prisma.serviceDirectory.update({ where: { id }, data: { isActive: false } });

    await logAudit({
      adminId: admin.id,
      action: "DIRECTORY_DELETE",
      entity: "ServiceDirectory",
      entityId: id,
      ipAddress: getClientIp(req),
    });

    return apiOk();
  } catch (error) {
    return apiServerError("admin/directory/delete", error);
  }
}
