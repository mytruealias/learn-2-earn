import { z } from "zod";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseQuery } from "@/lib/api-helpers";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  entity: z.string().max(120).optional().default(""),
  action: z.string().max(120).optional().default(""),
});

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    if (!requireRole(admin.role, ["admin"])) {
      return apiError("forbidden", "Admin role required", 403);
    }

    const url = new URL(req.url);
    const parsed = parseQuery(Object.fromEntries(url.searchParams), QuerySchema);
    if (!parsed.ok) return parsed.response;
    const { page, entity, action } = parsed.data;

    const limit = 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entity) where.entity = entity;
    if (action) where.action = { contains: action };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { admin: { select: { fullName: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return apiOk({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiServerError("admin/audit", error);
  }
}
