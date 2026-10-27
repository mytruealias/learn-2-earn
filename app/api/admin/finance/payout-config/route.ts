import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { apiError, apiOk } from "@/lib/api-helpers";
import { staffWrite, rewardError } from "@/lib/rewards/http";
import { audit, RewardIssue } from "@/lib/rewards/accounting";
import { fraction, methodDefinitions } from "@/lib/rewards/money";
const rate = z
  .union([z.string().max(100), z.number().finite().positive()])
  .transform(String)
  .refine((s) => {
    try {
      return fraction(s).n > 0n;
    } catch {
      return false;
    }
  }, "Enter an exact positive decimal rate.");
const fields = {
  programName: z.string().trim().min(1).max(200),
  xpToDollar: rate,
  minimumXp: z.number().int().min(1).max(1000000),
  weeklyXpCap: z.number().int().min(1).max(10000000),
  methods: z
    .array(z.enum(["venmo", "paypal", "cashapp", "check", "zelle"]))
    .max(5),
  separateApprover: z.boolean(),
  manualWorkflowConfirmed: z.literal(true),
};
const create = z
  .object({ ...fields, programSlug: z.string().regex(/^[a-z0-9-]{1,60}$/) })
  .strict();
const update = z
  .object({
    ...fields,
    id: z.string().min(1).max(120),
    version: z.number().int().positive(),
    isActive: z.boolean(),
  })
  .strict();
export async function GET(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (!["admin", "finance"].includes(a.role))
      return apiError("forbidden", "Finance access required.", 403);
    return apiOk(
      {
        configs: await prisma.payoutConfig.findMany({
          orderBy: { programName: "asc" },
        }),
        methodDefinitions,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return rewardError(e);
  }
}
async function save(req: Request, editing: boolean) {
  return staffWrite(
    req,
    editing ? update : create,
    ["admin", "finance"],
    async (tx, admin, data) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(74219932)::text`;
      if (data.weeklyXpCap < data.minimumXp)
        throw new RewardIssue(
          "validation_error",
          "Cap must be at least the minimum.",
          400,
        );
      const values = {
        programName: data.programName,
        xpToDollar: Number(data.xpToDollar),
        rateExact: data.xpToDollar,
        minimumXp: data.minimumXp,
        weeklyXpCap: data.weeklyXpCap,
        paymentMethods: JSON.stringify([...new Set(data.methods)]),
        separateApprover: data.separateApprover,
      };
      let config;
      if ("id" in data) {
        const old = await tx.payoutConfig.findUnique({
          where: { id: data.id },
        });
        if (!old || old.version !== data.version)
          throw new RewardIssue(
            "conflict",
            "These program terms changed. Reload before saving.",
          );
        config = await tx.payoutConfig.update({
          where: { id: data.id },
          data: {
            ...values,
            isActive: data.isActive,
            version: { increment: 1 },
          },
        });
      } else {
        if (
          await tx.payoutConfig.findUnique({
            where: { programSlug: data.programSlug },
          })
        )
          throw new RewardIssue(
            "conflict",
            "A program with this slug already exists.",
          );
        config = await tx.payoutConfig.create({
          data: { ...values, programSlug: data.programSlug },
        });
      }
      await audit(tx, "PAYOUT_CONFIG_VERSIONED", config.id, admin.id, {
        version: config.version,
        ...values,
      });
      return { config };
    },
  );
}
export async function POST(req: Request) {
  return save(req, false);
}
export async function PUT(req: Request) {
  return save(req, true);
}
