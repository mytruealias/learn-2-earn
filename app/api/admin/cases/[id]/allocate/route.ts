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
    const { resourceType, quantity = 1, notes } = body;

    if (!resourceType) {
      return NextResponse.json({ error: "resourceType is required" }, { status: 400 });
    }

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const resourceLabels: Record<string, string> = {
      shelter: "Shelter referral",
      food: "Food bank referral",
      bus_pass: "Bus pass",
      hygiene: "Hygiene kit",
      clothing: "Clothing voucher",
      mental_health: "Mental health referral",
    };

    const label = resourceLabels[resourceType] || resourceType;
    const noteText = `Allocated: ${label} (qty: ${quantity}).${notes ? ` Notes: ${notes}` : ""}`;

    const [allocation] = await Promise.all([
      prisma.resourceAllocation.create({
        data: { caseId: id, adminId: admin.id, resourceType, quantity: Number(quantity), notes: notes || null },
        include: { admin: { select: { id: true, fullName: true } } },
      }),
      prisma.caseNote.create({
        data: { caseId: id, adminId: admin.id, type: "resource", text: noteText },
      }),
    ]);

    await logAudit({
      adminId: admin.id,
      action: "CASE_RESOURCE_ALLOCATE",
      entity: "Case",
      entityId: id,
      details: JSON.stringify({ resourceType, quantity, notes }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, allocation });
  } catch (error) {
    console.error("Case allocate error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
