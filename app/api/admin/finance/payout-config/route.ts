import { NextResponse } from "next/server";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

const ALLOWED_ROLES = ["admin", "finance"];

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const configs = await prisma.payoutConfig.findMany({
      orderBy: { programName: "asc" },
    });

    return NextResponse.json({ ok: true, configs });
  } catch (error) {
    console.error("Payout config list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { programSlug, programName, xpToDollar, minimumXp, weeklyXpCap } = body;

    if (!programSlug || typeof programSlug !== "string" || !programSlug.trim()) {
      return NextResponse.json({ error: "Program slug is required" }, { status: 400 });
    }

    if (!programName || typeof programName !== "string" || !programName.trim()) {
      return NextResponse.json({ error: "Program name is required" }, { status: 400 });
    }

    const slug = programSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    if (typeof xpToDollar !== "number" || xpToDollar <= 0) {
      return NextResponse.json({ error: "XP-to-dollar rate must be a positive number" }, { status: 400 });
    }

    if (!Number.isInteger(minimumXp) || minimumXp < 1) {
      return NextResponse.json({ error: "Minimum XP must be a positive integer" }, { status: 400 });
    }

    if (!Number.isInteger(weeklyXpCap) || weeklyXpCap < 1) {
      return NextResponse.json({ error: "Weekly XP cap must be a positive integer" }, { status: 400 });
    }

    if (weeklyXpCap < minimumXp) {
      return NextResponse.json({ error: "Weekly XP cap must be greater than or equal to minimum XP" }, { status: 400 });
    }

    const existing = await prisma.payoutConfig.findUnique({ where: { programSlug: slug } });
    if (existing) {
      return NextResponse.json({ error: "A config with this program slug already exists" }, { status: 409 });
    }

    const config = await prisma.payoutConfig.create({
      data: {
        programSlug: slug,
        programName: programName.trim(),
        xpToDollar,
        minimumXp,
        weeklyXpCap,
      },
    });

    await logAudit({
      adminId: admin.id,
      action: "PAYOUT_CONFIG_CREATED",
      entity: "PayoutConfig",
      entityId: config.id,
      details: JSON.stringify({ programSlug: slug, xpToDollar, minimumXp, weeklyXpCap }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error("Payout config create error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, programName, xpToDollar, minimumXp, weeklyXpCap, isActive } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Config ID is required" }, { status: 400 });
    }

    const existing = await prisma.payoutConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (programName !== undefined) {
      if (typeof programName !== "string" || !programName.trim()) {
        return NextResponse.json({ error: "Program name cannot be empty" }, { status: 400 });
      }
      updateData.programName = programName.trim();
    }

    if (xpToDollar !== undefined) {
      if (typeof xpToDollar !== "number" || xpToDollar <= 0) {
        return NextResponse.json({ error: "XP-to-dollar rate must be a positive number" }, { status: 400 });
      }
      updateData.xpToDollar = xpToDollar;
    }

    if (minimumXp !== undefined) {
      if (!Number.isInteger(minimumXp) || minimumXp < 1) {
        return NextResponse.json({ error: "Minimum XP must be a positive integer" }, { status: 400 });
      }
      updateData.minimumXp = minimumXp;
    }

    if (weeklyXpCap !== undefined) {
      if (!Number.isInteger(weeklyXpCap) || weeklyXpCap < 1) {
        return NextResponse.json({ error: "Weekly XP cap must be a positive integer" }, { status: 400 });
      }
      updateData.weeklyXpCap = weeklyXpCap;
    }

    if (isActive !== undefined) {
      updateData.isActive = !!isActive;
    }

    const effectiveMin = (updateData.minimumXp as number) ?? existing.minimumXp;
    const effectiveCap = (updateData.weeklyXpCap as number) ?? existing.weeklyXpCap;
    if (effectiveCap < effectiveMin) {
      return NextResponse.json({ error: "Weekly XP cap must be greater than or equal to minimum XP" }, { status: 400 });
    }

    const config = await prisma.payoutConfig.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      adminId: admin.id,
      action: "PAYOUT_CONFIG_UPDATED",
      entity: "PayoutConfig",
      entityId: config.id,
      details: JSON.stringify(updateData),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error("Payout config update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
