import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, parseQuery, getClientIp } from "@/lib/api-helpers";

const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

const QuerySchema = z.object({
  category: z.string().max(60).optional().default(""),
  search: z.string().max(200).optional().default(""),
});

const PostSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(200),
  category: z.string().trim().min(1, "category is required").max(60),
  address: optStr(500),
  phone: optStr(60),
  hours: optStr(200),
  notes: optStr(2000),
  website: optStr(500),
});

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const url = new URL(req.url);
    const parsed = parseQuery(Object.fromEntries(url.searchParams), QuerySchema);
    if (!parsed.ok) return parsed.response;
    const { category, search } = parsed.data;

    const where: Record<string, unknown> = { isActive: true };
    if (category && category !== "all") where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const entries = await prisma.serviceDirectory.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    await logAudit({
      adminId: admin.id,
      action: "DIRECTORY_LIST_VIEW",
      entity: "ServiceDirectory",
      details: JSON.stringify({ category, search }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ entries });
  } catch (error) {
    return apiServerError("admin/directory/get", error);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const parsed = await parseJson(req, PostSchema);
    if (!parsed.ok) return parsed.response;
    const data = parsed.data;

    const entry = await prisma.serviceDirectory.create({
      data: {
        name: data.name,
        category: data.category,
        address: data.address ?? null,
        phone: data.phone ?? null,
        hours: data.hours ?? null,
        notes: data.notes ?? null,
        website: data.website ?? null,
      },
    });

    await logAudit({
      adminId: admin.id,
      action: "DIRECTORY_CREATE",
      entity: "ServiceDirectory",
      entityId: entry.id,
      details: JSON.stringify({ name: data.name, category: data.category }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ entry });
  } catch (error) {
    return apiServerError("admin/directory/create", error);
  }
}
