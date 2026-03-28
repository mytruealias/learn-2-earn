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
    const { text, type = "note" } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Note text is required" }, { status: 400 });
    }

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const note = await prisma.caseNote.create({
      data: { caseId: id, adminId: admin.id, text: text.trim(), type },
      include: { admin: { select: { id: true, fullName: true, role: true } } },
    });

    await logAudit({
      adminId: admin.id,
      action: "CASE_NOTE_ADD",
      entity: "Case",
      entityId: id,
      details: JSON.stringify({ noteType: type, noteLength: text.length }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, note });
  } catch (error) {
    console.error("Case note error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
