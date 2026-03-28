import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "";
    const priority = url.searchParams.get("priority") || "";
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true, caseNumber: true } },
          assignedTo: { select: { id: true, fullName: true } },
          _count: { select: { notes: true, allocations: true } },
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      cases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin cases error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, title, message, priority = "medium" } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "userId, title, and message are required" }, { status: 400 });
    }

    const newCase = await prisma.case.create({
      data: { userId, title, message, priority, status: "new" },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logAudit({
      adminId: admin.id,
      action: "CASE_CREATE",
      entity: "Case",
      entityId: newCase.id,
      details: JSON.stringify({ title, userId }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, case: newCase });
  } catch (error) {
    console.error("Admin case create error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
