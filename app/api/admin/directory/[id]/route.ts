import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { name, category, address, phone, hours, notes, website } = body;

    const entry = await prisma.serviceDirectory.update({
      where: { id },
      data: { name, category, address, phone, hours, notes, website },
    });

    await logAudit({
      adminId: admin.id,
      action: "DIRECTORY_UPDATE",
      entity: "ServiceDirectory",
      entityId: id,
      details: JSON.stringify({ name }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    console.error("Directory PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await prisma.serviceDirectory.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      adminId: admin.id,
      action: "DIRECTORY_DELETE",
      entity: "ServiceDirectory",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Directory DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
