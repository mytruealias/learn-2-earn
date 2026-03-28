import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, role: true },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ ok: true, staff });
  } catch (error) {
    console.error("Cases staff list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
