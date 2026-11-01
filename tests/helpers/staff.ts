import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { assertTestDatabase } from "@/lib/test-database-safety";
import { createAdmin, createUser, ensureTestProgram } from "./factories";
import { createStaffSession, getAdminSessionFromToken } from "@/lib/admin-auth";
import { makeRequest } from "./request";
export async function staffFixture(role = "admin") {
  await assertTestDatabase(prisma);
  const { admin } = await createAdmin({ role }),
    token = await prisma.$transaction((tx) =>
      createStaffSession(tx, admin.id, true, "test-program"),
    );
  return { admin, token, scope: (await getAdminSessionFromToken(token))! };
}
export const staffRequest = (
  token: string,
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
  programId = "test-program",
) =>
  makeRequest(`http://test/api/admin/${path}`, {
    method,
    body,
    cookies: { l2e_admin_session: token },
    headers: { "x-l2e-program": programId },
  });
export async function boundaryFixture() {
  await assertTestDatabase(prisma);
  await ensureTestProgram();
  await prisma.organization.create({
    data: { id: "other-organization", name: "Private other organization" },
  });
  await prisma.program.create({
    data: {
      id: "other-program",
      organizationId: "other-organization",
      slug: "other-program",
      name: "Private other program",
    },
  });
  const { user } = await createUser({ fullName: "Authorized participant" });
  const other = await prisma.user.create({
    data: {
      fullName: "Private unrelated participant",
      enrollment: { create: { programId: "other-program" } },
    },
  });
  const c = await prisma.case.create({
    data: {
      programId: "test-program",
      userId: user.id,
      title: "Authorized support case",
      message: "Synthetic support context",
    },
  });
  const foreignCase = await prisma.case.create({
    data: {
      programId: "other-program",
      userId: other.id,
      title: "Private other case",
      message: "Do not expose this context",
    },
  });
  const foreignService = await prisma.serviceDirectory.create({
    data: {
      programId: "other-program",
      name: "Private other service",
      category: "Food",
    },
  });
  const foreignPayout = await prisma.payoutRequest.create({
    data: {
      programId: "other-program",
      userId: other.id,
      xpAmount: 20,
      dollarAmount: 1,
      amountCents: 100,
      status: "approved",
      rulesSnapshot: '{"rate":"0.05"}',
      paymentHandle: "@private-unrelated",
      paymentMethod: "venmo",
    },
  });
  const foreignConfig = await prisma.payoutConfig.create({
    data: {
      programId: "other-program",
      programSlug: "other-terms",
      programName: "Private other terms",
    },
  });
  await prisma.poolBalance.create({
    data: {
      id: "other-pool",
      programId: "other-program",
      balanceCents: 987654,
    },
  });
  return {
    user,
    other,
    c,
    foreignCase,
    foreignService,
    foreignPayout,
    foreignConfig,
    key: () => randomUUID(),
  };
}
