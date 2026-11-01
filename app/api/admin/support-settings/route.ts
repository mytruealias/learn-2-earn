import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { scopedDb } from "@/lib/program-scope";
import { apiError, apiOk, apiServerError } from "@/lib/api-helpers";
import { staffWrite } from "@/lib/rewards/http";
import { RewardIssue } from "@/lib/rewards/accounting";
const schema = z
  .object({
    expectedVersion: z.number().int().nonnegative(),
    enabled: z.boolean(),
    teamName: z.string().trim().max(120),
    monitoring: z.string().trim().max(500),
    region: z.enum(["US", "other"]),
    reviewReference: z.string().trim().min(5).max(200),
    confirmed: z.literal(true),
  })
  .strict()
  .superRefine((d, c) => {
    if (d.enabled && (d.teamName.length < 3 || d.monitoring.length < 10))
      c.addIssue({
        code: "custom",
        message:
          "Name the responsible team and actual monitoring schedule, including timezone.",
      });
  });
export async function GET(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (a.role !== "admin")
      return apiError("forbidden", "Program administrator required.", 403);
    return apiOk({
      settings: await scopedDb(a).program.findUnique({
        where: { id: a.programId },
        select: {
          supportEnabled: true,
          supportTeamName: true,
          supportMonitoring: true,
          supportRegion: true,
          supportReviewReference: true,
          supportVersion: true,
        },
      }),
    });
  } catch (e) {
    return apiServerError("support/settings", e);
  }
}
export async function PUT(req: Request) {
  return staffWrite(req, schema, ["admin"], async (tx, a, d) => {
    await tx.$queryRaw`SELECT "id" FROM "Program" WHERE "id"=${a.programId} FOR UPDATE`;
    const p = await tx.program.findUniqueOrThrow({
      where: { id: a.programId },
    });
    if (p.supportVersion !== d.expectedVersion)
      throw new RewardIssue(
        "conflict",
        "Another administrator changed support intake. Reload before confirming.",
      );
    const settings = await tx.program.update({
      where: { id: a.programId, supportVersion: d.expectedVersion },
      data: {
        supportEnabled: d.enabled,
        supportTeamName: d.teamName || null,
        supportMonitoring: d.monitoring || null,
        supportRegion: d.region,
        supportReviewReference: d.reviewReference,
        supportVersion: { increment: 1 },
      },
    });
    await tx.auditLog.create({
      data: {
        adminId: a.id,
        action: "SUPPORT_INTAKE_CONFIGURED",
        entity: "Program",
        entityId: a.programId,
        details: JSON.stringify({
          enabled: d.enabled,
          version: settings.supportVersion,
          reviewReference: d.reviewReference,
        }),
      },
    });
    return { version: settings.supportVersion };
  });
}
