import { z } from "zod";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, getClientIp } from "@/lib/api-helpers";

const ALLOWED_ROLES = ["admin", "finance"];

const PostSchema = z.object({
  programSlug: z.string().trim().min(1, "Program slug is required").max(60),
  programName: z.string().trim().min(1, "Program name is required").max(200),
  xpToDollar: z.number().positive("XP-to-dollar rate must be a positive number"),
  minimumXp: z.number().int().min(1, "Minimum XP must be a positive integer").max(1_000_000),
  weeklyXpCap: z.number().int().min(1, "Weekly XP cap must be a positive integer").max(10_000_000),
}).refine((d) => d.weeklyXpCap >= d.minimumXp, {
  message: "Weekly XP cap must be greater than or equal to minimum XP",
  path: ["weeklyXpCap"],
});

const PutSchema = z.object({
  id: z.string().min(1, "Config ID is required").max(120),
  programName: z.string().trim().min(1).max(200).optional(),
  xpToDollar: z.number().positive().optional(),
  minimumXp: z.number().int().min(1).max(1_000_000).optional(),
  weeklyXpCap: z.number().int().min(1).max(10_000_000).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return apiError("forbidden", "Admin or finance role required", 403);
    }

    const configs = await prisma.payoutConfig.findMany({ orderBy: { programName: "asc" } });
    return apiOk({ configs });
  } catch (error) {
    return apiServerError("admin/finance/payout-config/get", error);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return apiError("forbidden", "Admin or finance role required", 403);
    }

    const parsed = await parseJson(req, PostSchema);
    if (!parsed.ok) return parsed.response;
    const { programName, xpToDollar, minimumXp, weeklyXpCap } = parsed.data;
    const slug = parsed.data.programSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const existing = await prisma.payoutConfig.findUnique({ where: { programSlug: slug } });
    if (existing) {
      return apiError("conflict", "A config with this program slug already exists", 409);
    }

    const config = await prisma.payoutConfig.create({
      data: { programSlug: slug, programName, xpToDollar, minimumXp, weeklyXpCap },
    });

    await logAudit({
      adminId: admin.id,
      action: "PAYOUT_CONFIG_CREATED",
      entity: "PayoutConfig",
      entityId: config.id,
      details: JSON.stringify({ programSlug: slug, xpToDollar, minimumXp, weeklyXpCap }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ config });
  } catch (error) {
    return apiServerError("admin/finance/payout-config/post", error);
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return apiError("forbidden", "Admin or finance role required", 403);
    }

    const parsed = await parseJson(req, PutSchema);
    if (!parsed.ok) return parsed.response;
    const { id, programName, xpToDollar, minimumXp, weeklyXpCap, isActive } = parsed.data;

    const existing = await prisma.payoutConfig.findUnique({ where: { id } });
    if (!existing) return apiError("not_found", "Config not found", 404);

    const updateData: Record<string, unknown> = {};
    if (programName !== undefined) updateData.programName = programName;
    if (xpToDollar !== undefined) updateData.xpToDollar = xpToDollar;
    if (minimumXp !== undefined) updateData.minimumXp = minimumXp;
    if (weeklyXpCap !== undefined) updateData.weeklyXpCap = weeklyXpCap;
    if (isActive !== undefined) updateData.isActive = isActive;

    const effectiveMin = (updateData.minimumXp as number) ?? existing.minimumXp;
    const effectiveCap = (updateData.weeklyXpCap as number) ?? existing.weeklyXpCap;
    if (effectiveCap < effectiveMin) {
      return apiError("bad_request", "Weekly XP cap must be greater than or equal to minimum XP", 400);
    }

    const config = await prisma.payoutConfig.update({ where: { id }, data: updateData });

    await logAudit({
      adminId: admin.id,
      action: "PAYOUT_CONFIG_UPDATED",
      entity: "PayoutConfig",
      entityId: config.id,
      details: JSON.stringify(updateData),
      ipAddress: getClientIp(req),
    });

    return apiOk({ config });
  } catch (error) {
    return apiServerError("admin/finance/payout-config/put", error);
  }
}
