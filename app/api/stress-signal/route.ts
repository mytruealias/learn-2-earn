import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/user-session";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);

    const body = await req.json();
    const { message, location } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const guestId = body.guestId;
      if (guestId) {
        const guest = await prisma.user.findUnique({ where: { guestId } });
        resolvedUserId = guest?.id || null;
      }
    }

    const title = "Stress signal from learner";

    const newCase = await prisma.case.create({
      data: {
        userId: resolvedUserId || await getOrCreateAnonymousUser(),
        title,
        message: message.trim(),
        location: location?.trim() || null,
        status: "new",
        priority: "high",
      },
    });

    return NextResponse.json({ ok: true, caseId: newCase.id });
  } catch (error) {
    console.error("Stress signal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function getOrCreateAnonymousUser(): Promise<string> {
  const anon = await prisma.user.findFirst({ where: { email: "anonymous@system.internal" } });
  if (anon) return anon.id;
  const created = await prisma.user.create({
    data: { email: "anonymous@system.internal", fullName: "Anonymous" },
  });
  return created.id;
}
