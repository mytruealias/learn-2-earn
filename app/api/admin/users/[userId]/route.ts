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

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ ok: true, user: safeUser });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
