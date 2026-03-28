import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const c = await prisma.case.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, caseNumber: true, city: true, state: true } },
        assignedTo: { select: { id: true, fullName: true, role: true } },
        notes: {
          include: { admin: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        allocations: {
          include: { admin: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, case: c });
  } catch (error) {
    console.error("Admin case detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status, priority, assignedToId } = body;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.case.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      },
    });

    await logAudit({
      adminId: admin.id,
      action: "CASE_UPDATE",
      entity: "Case",
      entityId: id,
      details: JSON.stringify({ status, priority, assignedToId }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, case: updated });
  } catch (error) {
    console.error("Admin case update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
