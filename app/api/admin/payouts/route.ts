import { NextResponse } from "next/server";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "pending";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    const where = status === "all" ? {} : { status };

    const [payouts, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, totalXp: true, caseNumber: true },
          },
          reviewedBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payoutRequest.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      payouts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin payouts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { payoutId, action, note, decisionNote } = body;

    if (!payoutId || !action) {
      return NextResponse.json({ error: "Missing payoutId or action" }, { status: 400 });
    }

    const payout = await prisma.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    const validTransitions: Record<string, string[]> = {
      pending: ["review", "reject"],
      reviewed: ["approve", "reject"],
      approved: ["complete"],
    };

    const allowed = validTransitions[payout.status] || [];
    if (!allowed.includes(action)) {
      return NextResponse.json({
        error: `Cannot ${action} a payout that is currently ${payout.status}`,
      }, { status: 400 });
    }

    const finalDecisionNote = decisionNote ? decisionNote.slice(0, 500) : null;
    let updateData: Record<string, unknown> = {};

    if (action === "review") {
      if (!requireRole(admin.role, ["admin", "caseworker"])) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
      updateData = {
        status: "reviewed",
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNote: note || null,
        ...(finalDecisionNote !== null ? { decisionNote: finalDecisionNote } : {}),
      };
    } else if (action === "approve") {
      if (!requireRole(admin.role, ["admin", "finance"])) {
        return NextResponse.json({ error: "Only admin or finance can approve" }, { status: 403 });
      }
      updateData = {
        status: "approved",
        approvedById: admin.id,
        approvedAt: new Date(),
        note: note || payout.note,
        ...(finalDecisionNote !== null ? { decisionNote: finalDecisionNote } : {}),
      };
    } else if (action === "reject") {
      if (!requireRole(admin.role, ["admin", "finance", "caseworker"])) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
      updateData = {
        status: "rejected",
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNote: note || "Rejected",
        ...(finalDecisionNote !== null ? { decisionNote: finalDecisionNote } : {}),
      };
    } else if (action === "complete") {
      if (!requireRole(admin.role, ["admin", "finance"])) {
        return NextResponse.json({ error: "Only admin or finance can mark complete" }, { status: 403 });
      }
      updateData = {
        status: "completed",
        note: note || "Payment sent",
        ...(finalDecisionNote !== null ? { decisionNote: finalDecisionNote } : {}),
      };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.payoutRequest.update({
      where: { id: payoutId },
      data: updateData,
    });

    await logAudit({
      adminId: admin.id,
      action: `PAYOUT_${action.toUpperCase()}`,
      entity: "PayoutRequest",
      entityId: payoutId,
      details: JSON.stringify({ previousStatus: payout.status, newStatus: updated.status, note, decisionNote: finalDecisionNote }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, payout: updated });
  } catch (error) {
    console.error("Admin payout action error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
