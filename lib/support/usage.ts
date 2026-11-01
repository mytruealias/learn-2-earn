import { randomUUID } from "node:crypto";
import prisma from "../prisma";
import { SUPPORT_POLICY_VERSION } from "./policy";
export class SupportLimit extends Error {
  constructor(public retryAfter: number) {
    super(
      "Hubert is temporarily at its usage limit. Human help and learning remain available.",
    );
  }
}
export async function reserveSupportUsage(
  userId: string,
  kind: "chat" | "tts",
  units: number,
) {
  const token = randomUUID(),
    now = new Date(),
    hour = new Date(Math.floor(now.getTime() / 3600000) * 3600000),
    day = new Date(Math.floor(now.getTime() / 86400000) * 86400000);
  const daily = Math.max(
    1,
    Math.min(
      1000000,
      Math.floor(Number(process.env.TTS_DAILY_CHAR_CAP) || 20000),
    ),
  );
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    if (!user?.isActive) throw new SupportLimit(60);
    const lease = await tx.supportLease.findUnique({
      where: { userId_kind: { userId, kind } },
    });
    if (lease && lease.expiresAt > now)
      throw new SupportLimit(
        Math.max(
          1,
          Math.ceil((lease.expiresAt.getTime() - now.getTime()) / 1000),
        ),
      );
    const limits =
      kind === "chat"
        ? [
            {
              kind: "chat-hour",
              windowAt: hour,
              ms: 3600000,
              count: 30,
              units: 120000,
            },
          ]
        : [
            {
              kind: "tts-hour",
              windowAt: hour,
              ms: 3600000,
              count: 120,
              units: 1000000,
            },
            {
              kind: "tts-day",
              windowAt: day,
              ms: 86400000,
              count: 1000000,
              units: daily,
            },
          ];
    for (const limit of limits) {
      const old = await tx.supportUsage.findUnique({
          where: { userId_kind: { userId, kind: limit.kind } },
        }),
        same = old?.windowAt.getTime() === limit.windowAt.getTime(),
        count = (same ? old!.count : 0) + 1,
        total = (same ? old!.units : 0) + units;
      if (count > limit.count || total > limit.units)
        throw new SupportLimit(
          Math.max(
            1,
            Math.ceil(
              (limit.windowAt.getTime() + limit.ms - now.getTime()) / 1000,
            ),
          ),
        );
      await tx.supportUsage.upsert({
        where: { userId_kind: { userId, kind: limit.kind } },
        create: {
          userId,
          kind: limit.kind,
          windowAt: limit.windowAt,
          count,
          units: total,
          policyVersion: SUPPORT_POLICY_VERSION,
        },
        update: {
          windowAt: limit.windowAt,
          count,
          units: total,
          policyVersion: SUPPORT_POLICY_VERSION,
        },
      });
    }
    await tx.supportLease.upsert({
      where: { userId_kind: { userId, kind } },
      create: {
        userId,
        kind,
        token,
        expiresAt: new Date(now.getTime() + 60000),
      },
      update: { token, expiresAt: new Date(now.getTime() + 60000) },
    });
  });
  return async () => {
    await prisma.supportLease
      .deleteMany({ where: { userId, kind, token } })
      .catch(() => {});
  };
}
