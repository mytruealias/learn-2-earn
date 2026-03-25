import { NextResponse } from "next/server";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!requireRole(admin.role, ["admin"])) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const staff = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        loginFailures: true,
        lockedUntil: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ok: true, staff });
  } catch (error) {
    console.error("Admin staff list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!requireRole(admin.role, ["admin"])) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const { email, fullName, role } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json({ error: "email, fullName, and role are required" }, { status: 400 });
    }

    if (!["admin", "caseworker", "finance"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const tempPassword = crypto.randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const newAdmin = await prisma.adminUser.create({
      data: { email, fullName, role, passwordHash, isActive: true },
      select: {
        id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, lastLoginAt: true,
      },
    });

    await logAudit({
      adminId: admin.id,
      action: "STAFF_CREATE",
      entity: "AdminUser",
      entityId: newAdmin.id,
      details: JSON.stringify({ email, fullName, role }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, staff: newAdmin, tempPassword });
  } catch (error) {
    console.error("Admin staff create error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
