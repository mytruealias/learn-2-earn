import { NextResponse } from "next/server";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ staffId: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!requireRole(admin.role, ["admin"])) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const { staffId } = await params;
    const body = await req.json();
    const { isActive } = body;

    if (staffId === admin.id) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
    }

    const target = await prisma.adminUser.findUnique({ where: { id: staffId } });
    if (!target) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const updated = await prisma.adminUser.update({
      where: { id: staffId },
      data: { isActive },
      select: {
        id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, lastLoginAt: true,
      },
    });

    await logAudit({
      adminId: admin.id,
      action: isActive ? "STAFF_REACTIVATE" : "STAFF_DEACTIVATE",
      entity: "AdminUser",
      entityId: staffId,
      details: JSON.stringify({ email: target.email, isActive }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, staff: updated });
  } catch (error) {
    console.error("Admin staff patch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
