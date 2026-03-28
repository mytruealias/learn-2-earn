import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/user-session";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized — please log in to send a signal" }, { status: 401 });
    }

    const body = await req.json();
    const { message, location } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const newCase = await prisma.case.create({
      data: {
        userId,
        title: "Stress signal from learner",
        message: message.trim(),
        location: location?.trim() || null,
        status: "new",
        priority: "high",
      },
    });

    await logAudit({
      action: "CASE_CREATE_STRESS_SIGNAL",
      entity: "Case",
      entityId: newCase.id,
      details: JSON.stringify({ userId, location: location?.trim() || null }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, caseId: newCase.id });
  } catch (error) {
    console.error("Stress signal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
