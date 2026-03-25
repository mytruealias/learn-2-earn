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
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { caseNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          city: true,
          state: true,
          caseNumber: true,
          totalXp: true,
          hearts: true,
          streak: true,
          createdAt: true,
          lastActiveAt: true,
          consentGiven: true,
          _count: {
            select: {
              progress: true,
              payoutRequests: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    await logAudit({
      adminId: admin.id,
      action: "VIEW_USERS",
      entity: "User",
      details: JSON.stringify({ search, page, resultCount: users.length }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      ok: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
