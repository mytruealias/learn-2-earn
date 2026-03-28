import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const category = url.searchParams.get("category") || "";
    const search = url.searchParams.get("search") || "";

    const where: Record<string, unknown> = { isActive: true };
    if (category && category !== "all") where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const entries = await prisma.serviceDirectory.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ ok: true, entries });
  } catch (error) {
    console.error("Directory GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, category, address, phone, hours, notes, website } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "name and category are required" }, { status: 400 });
    }

    const entry = await prisma.serviceDirectory.create({
      data: { name, category, address, phone, hours, notes, website },
    });

    await logAudit({
      adminId: admin.id,
      action: "DIRECTORY_CREATE",
      entity: "ServiceDirectory",
      entityId: entry.id,
      details: JSON.stringify({ name, category }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    console.error("Directory POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
