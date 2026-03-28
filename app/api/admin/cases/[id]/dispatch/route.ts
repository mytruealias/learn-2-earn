import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { staffId, notes } = body;

    if (!staffId) {
      return NextResponse.json({ error: "staffId is required" }, { status: 400 });
    }

    const [existing, staff] = await Promise.all([
      prisma.case.findUnique({ where: { id } }),
      prisma.adminUser.findUnique({ where: { id: staffId } }),
    ]);

    if (!existing) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    const [updatedCase] = await Promise.all([
      prisma.case.update({
        where: { id },
        data: { status: "dispatched", assignedToId: staffId },
      }),
      prisma.caseNote.create({
        data: {
          caseId: id,
          adminId: admin.id,
          type: "dispatch",
          text: `Dispatched ${staff.fullName} to this case.${notes ? ` Notes: ${notes}` : ""}`,
        },
      }),
    ]);

    await logAudit({
      adminId: admin.id,
      action: "CASE_DISPATCH",
      entity: "Case",
      entityId: id,
      details: JSON.stringify({ staffId, staffName: staff.fullName, notes }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, case: updatedCase });
  } catch (error) {
    console.error("Case dispatch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
