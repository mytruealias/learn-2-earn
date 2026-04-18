import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseQuery, getClientIp } from "@/lib/api-helpers";

const QuerySchema = z.object({
  search: z.string().max(200).optional().default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const url = new URL(req.url);
    const parsed = parseQuery(Object.fromEntries(url.searchParams), QuerySchema);
    if (!parsed.ok) return parsed.response;
    const { search, page } = parsed.data;

    const limit = 20;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { caseNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          city: true,
          state: true,
          caseNumber: true,
          totalXp: true,
          hearts: true,
          streak: true,
          createdAt: true,
          lastActiveAt: true,
          consentGiven: true,
          _count: { select: { progress: true, payoutRequests: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    await logAudit({
      adminId: admin.id,
      action: "VIEW_USERS",
      entity: "User",
      details: JSON.stringify({ search, page, resultCount: users.length }),
      ipAddress: getClientIp(req),
    });

    return apiOk({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiServerError("admin/users", error);
  }
}
