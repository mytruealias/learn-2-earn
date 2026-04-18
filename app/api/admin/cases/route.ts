import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, parseQuery, getClientIp } from "@/lib/api-helpers";

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

const QuerySchema = z.object({
  status: z.string().max(40).optional().default(""),
  priority: z.string().max(40).optional().default(""),
  search: z.string().max(200).optional().default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

const PostSchema = z.object({
  userId: z.string().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
});

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const url = new URL(req.url);
    const parsed = parseQuery(Object.fromEntries(url.searchParams), QuerySchema);
    if (!parsed.ok) return parsed.response;
    const { status, priority, search, page } = parsed.data;

    const limit = 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const total = await prisma.case.count({ where });

    const allFiltered = await prisma.case.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, caseNumber: true } },
        assignedTo: { select: { id: true, fullName: true } },
        _count: { select: { notes: true, allocations: true } },
      },
    });

    const sorted = allFiltered.sort((a, b) => {
      const pa = PRIORITY_RANK[a.priority] ?? 99;
      const pb = PRIORITY_RANK[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const cases = sorted.slice(skip, skip + limit);

    await logAudit({
      adminId: admin.id,
      action: "CASE_LIST_VIEW",
      entity: "Case",
      details: JSON.stringify({ status, priority, search, page }),
      ipAddress: getClientIp(req),
    });

    return apiOk({
      cases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiServerError("admin/cases", error);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const parsed = await parseJson(req, PostSchema);
    if (!parsed.ok) return parsed.response;
    const { userId, title, message, priority } = parsed.data;

    const newCase = await prisma.case.create({
      data: { userId, title, message, priority, status: "new" },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    await logAudit({
      adminId: admin.id,
      action: "CASE_CREATE",
      entity: "Case",
      entityId: newCase.id,
      details: JSON.stringify({ title, userId }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ case: newCase });
  } catch (error) {
    return apiServerError("admin/cases/create", error);
  }
}
