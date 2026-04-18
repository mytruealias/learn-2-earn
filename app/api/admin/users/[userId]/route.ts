import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          include: {
            lesson: {
              select: { title: true, xpReward: true, module: { select: { title: true, path: { select: { title: true } } } } },
            },
          },
          orderBy: { completedAt: "desc" },
        },
        payoutRequests: {
          orderBy: { createdAt: "desc" },
        },
        consents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await logAudit({
      adminId: admin.id,
      action: "VIEW_USER_DETAIL",
      entity: "User",
      entityId: userId,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;
    return NextResponse.json({ ok: true, user: safeUser });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await req.json();
    const { caseNumber, xpAdjustment, xpReason, isActive } = body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const auditDetails: Record<string, unknown> = {};

    if (typeof caseNumber === "string") {
      updateData.caseNumber = caseNumber || null;
      auditDetails.caseNumber = { from: user.caseNumber, to: caseNumber };
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
      auditDetails.isActive = { to: isActive };
    }

    if (typeof xpAdjustment === "number" && xpAdjustment !== 0) {
      if (!xpReason) {
        return NextResponse.json({ error: "XP adjustment requires a reason" }, { status: 400 });
      }
      updateData.totalXp = Math.max(0, user.totalXp + xpAdjustment);
      auditDetails.xpAdjustment = { amount: xpAdjustment, reason: xpReason, from: user.totalXp, to: updateData.totalXp };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await logAudit({
      adminId: admin.id,
      action: "USER_EDIT",
      entity: "User",
      entityId: userId,
      details: JSON.stringify(auditDetails),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    const { passwordHash: _passwordHash, ...safeUser } = updatedUser;
    void _passwordHash;
    return NextResponse.json({ ok: true, user: safeUser });
  } catch (error) {
    console.error("Admin user patch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
