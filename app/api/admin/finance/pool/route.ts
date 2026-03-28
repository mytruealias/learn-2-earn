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
      return NextResponse.json({ error: "Forbidden — admin or finance role required" }, { status: 403 });
    }

    let poolBalance = await prisma.poolBalance.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!poolBalance) {
      poolBalance = await prisma.poolBalance.create({ data: { balanceCents: 0 } });
    }

    const adjustments = await prisma.poolAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { admin: { select: { fullName: true } } },
    });

    return NextResponse.json({
      ok: true,
      pool: { balanceCents: poolBalance.balanceCents, updatedAt: poolBalance.updatedAt },
      adjustments: adjustments.map((a) => ({
        id: a.id,
        amountCents: a.amountCents,
        reason: a.reason,
        createdAt: a.createdAt,
        adminName: a.admin.fullName,
      })),
    });
  } catch (error) {
    console.error("Finance pool GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden — admin or finance role required" }, { status: 403 });
    }

    const body = await req.json();
    const { amountCents, reason } = body;

    if (typeof amountCents !== "number" || amountCents === 0) {
      return NextResponse.json({ error: "amountCents must be a non-zero integer" }, { status: 400 });
    }
    if (!reason?.trim()) {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    let poolBalance = await prisma.poolBalance.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!poolBalance) {
      poolBalance = await prisma.poolBalance.create({ data: { balanceCents: 0 } });
    }

    const newBalanceCents = poolBalance.balanceCents + amountCents;

    const [updatedPool, adjustment] = await prisma.$transaction([
      prisma.poolBalance.update({
        where: { id: poolBalance.id },
        data: { balanceCents: newBalanceCents, updatedById: admin.id },
      }),
      prisma.poolAdjustment.create({
        data: { adminId: admin.id, amountCents, reason: reason.trim() },
      }),
    ]);

    await logAudit({
      adminId: admin.id,
      action: amountCents > 0 ? "POOL_DEPOSIT" : "POOL_WITHDRAWAL",
      entity: "PoolBalance",
      entityId: updatedPool.id,
      details: JSON.stringify({ amountCents, reason: reason.trim(), newBalanceCents }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      ok: true,
      pool: { balanceCents: updatedPool.balanceCents, updatedAt: updatedPool.updatedAt },
      adjustment: { id: adjustment.id, amountCents, reason: adjustment.reason, createdAt: adjustment.createdAt },
    });
  } catch (error) {
    console.error("Finance pool POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
