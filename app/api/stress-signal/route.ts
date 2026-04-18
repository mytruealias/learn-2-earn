import { z } from "zod";
import { getUserIdFromRequest } from "@/lib/user-session";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, getClientIp } from "@/lib/api-helpers";

const Schema = z.object({
  message: z.string().trim().min(1, "message is required").max(2000),
  location: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return apiError("unauthorized", "Please log in to send a signal", 401);
    }

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const { message, location } = parsed.data;

    const newCase = await prisma.case.create({
      data: {
        userId,
        title: "Stress signal from learner",
        message,
        location: location ?? null,
        status: "new",
        priority: "high",
      },
    });

    await logAudit({
      action: "CASE_CREATE_STRESS_SIGNAL",
      entity: "Case",
      entityId: newCase.id,
      details: JSON.stringify({ userId, location: location ?? null }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ caseId: newCase.id });
  } catch (error) {
    return apiServerError("stress-signal", error);
  }
}
