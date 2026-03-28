import { NextResponse } from "next/server";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

const ALLOWED_ROLES = ["admin", "finance"];

const POOL_SINGLETON_ID = "singleton";

async function ensurePool() {
  return prisma.poolBalance.upsert({
    where: { id: POOL_SINGLETON_ID },
    update: {},
    create: { id: POOL_SINGLETON_ID, balanceCents: 0 },
  });
}

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden — admin or finance role required" }, { status: 403 });
    }

    const [poolBalance, adjustments] = await Promise.all([
      ensurePool(),
      prisma.poolAdjustment.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { admin: { select: { fullName: true } } },
      }),
    ]);

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

    const parsedAmount = typeof amountCents === "number" ? amountCents : parseInt(amountCents, 10);
    if (!Number.isInteger(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json({ error: "amountCents must be a non-zero integer" }, { status: 400 });
    }
    if (!reason?.trim()) {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    await ensurePool();

    const [updatedPool, adjustment] = await prisma.$transaction([
      prisma.poolBalance.update({
        where: { id: POOL_SINGLETON_ID },
        data: {
          balanceCents: { increment: parsedAmount },
          updatedById: admin.id,
        },
      }),
      prisma.poolAdjustment.create({
        data: { adminId: admin.id, amountCents: parsedAmount, reason: reason.trim() },
      }),
    ]);

    await logAudit({
      adminId: admin.id,
      action: parsedAmount > 0 ? "POOL_DEPOSIT" : "POOL_WITHDRAWAL",
      entity: "PoolBalance",
      entityId: updatedPool.id,
      details: JSON.stringify({ amountCents: parsedAmount, reason: reason.trim(), newBalanceCents: updatedPool.balanceCents }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      ok: true,
      pool: { balanceCents: updatedPool.balanceCents, updatedAt: updatedPool.updatedAt },
      adjustment: { id: adjustment.id, amountCents: parsedAmount, reason: adjustment.reason, createdAt: adjustment.createdAt },
    });
  } catch (error) {
    console.error("Finance pool POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
