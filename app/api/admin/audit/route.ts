import { NextResponse } from "next/server";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin || !requireRole(admin.role, ["admin"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const entity = url.searchParams.get("entity") || "";
    const action = url.searchParams.get("action") || "";
    const limit = 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entity) where.entity = entity;
    if (action) where.action = { contains: action };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: { select: { fullName: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin audit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
