import type { Prisma, PrismaClient } from "@prisma/client";
import prisma from "./prisma";

export interface StaffScope {
  id: string;
  role: string; // Compatibility alias: program_admin -> admin. Never AdminUser.role authority.
  programId: string;
  sessionId: string;
}
export class ScopeError extends Error {
  constructor(
    public status = 403,
    message = "This action is unavailable in your active program.",
  ) {
    super(message);
  }
}
export const participantWhere = (programId: string) => ({
  enrollment: { programId, status: "active" },
});
export const legacyRole = (role: string) =>
  role === "program_admin" ? "admin" : role;
export const membershipRole = (role: string) =>
  role === "admin"
    ? ("program_admin" as const)
    : role === "finance"
      ? ("finance" as const)
      : role === "caseworker"
        ? ("caseworker" as const)
        : null;
export async function participantProgram(
  db: Prisma.TransactionClient,
  userId: string,
) {
  const enrollment = await db.participantEnrollment.findFirst({
    where: {
      userId,
      status: "active",
      program: { isActive: true, organization: { isActive: true } },
    },
  });
  return enrollment?.programId ?? null;
}
export async function lockStaffScope(
  db: Prisma.TransactionClient,
  scope: StaffScope,
) {
  await db.$queryRaw`SELECT m."id" FROM "StaffMembership" m JOIN "AdminUser" a ON a."id"=m."adminId" JOIN "AdminSession" s ON s."adminId"=a."id" JOIN "Program" p ON p."id"=m."programId" JOIN "Organization" o ON o."id"=p."organizationId" WHERE m."adminId"=${scope.id} AND m."programId"=${scope.programId} AND s."id"=${scope.sessionId} FOR SHARE OF m,a,s,p,o`;
  const membership = await db.staffMembership.findFirst({
    where: {
      adminId: scope.id,
      programId: scope.programId,
      role: membershipRole(scope.role) ?? "program_admin",
      isActive: true,
      revokedAt: null,
      program: { isActive: true, organization: { isActive: true } },
      admin: {
        isActive: true,
        mfaConfirmedAt: { not: null },
        mustChangePassword: false,
        sessions: {
          some: {
            id: scope.sessionId,
            activeProgramId: scope.programId,
            mfaVerifiedAt: { not: null },
            revokedAt: null,
            expiresAt: { gt: new Date() },
            lastSeenAt: { gt: new Date(Date.now() - 30 * 60000) },
          },
        },
      },
    },
  });
  if (!membership)
    throw new ScopeError(
      403,
      "Your staff session or program permissions changed. Sign in again.",
    );
}
const ownModels = new Set([
  "payoutRequest",
  "case",
  "serviceDirectory",
  "auditLog",
  "payoutConfig",
  "poolBalance",
  "poolAdjustment",
  "staffActionReceipt",
  "staffMembership",
]);
const userModels = new Set([
  "progress",
  "consentRecord",
  "lessonAttempt",
  "lessonReview",
  "lessonVisit",
  "pathSelection",
  "rewardAccount",
  "rewardEntry",
  "learnerSession",
]);
const sharedModels = new Set(["path", "module", "lesson", "card"]);
const reads = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "findFirstOrThrow",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);
type Args = Record<string, unknown>;
function noPrivateSharedIncludes(value: unknown) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (
      ["progress", "attempts", "reviews", "visits", "selections"].includes(key)
    )
      throw new ScopeError(
        403,
        "Use scoped participant queries for learning evidence.",
      );
    noPrivateSharedIncludes(child);
  }
}

/** Request-local scoped query client. Unknown models/raw SQL/nested writes fail closed.
 * All existing staff delegates, aggregates, transactions and exports use this client.
 * Server-owned foreign IDs are checked here as well as in workflow endpoints. */
export function scopedDb(scope: StaffScope): PrismaClient;
export function scopedDb(
  scope: StaffScope,
  db: Prisma.TransactionClient,
): Prisma.TransactionClient;
export function scopedDb(
  scope: StaffScope,
  db: PrismaClient | Prisma.TransactionClient = prisma,
): PrismaClient {
  if (!scope.programId || !scope.sessionId) throw new ScopeError();
  const access = () => ({
    isActive: true,
    organization: { isActive: true },
    memberships: {
      some: {
        adminId: scope.id,
        isActive: true,
        revokedAt: null,
        role: membershipRole(scope.role) ?? "program_admin",
        admin: {
          isActive: true,
          sessions: {
            some: {
              id: scope.sessionId,
              revokedAt: null,
              expiresAt: { gt: new Date() },
              mfaVerifiedAt: { not: null },
              lastSeenAt: { gt: new Date(Date.now() - 30 * 60_000) },
              activeProgramId: scope.programId,
            },
          },
        },
      },
    },
  });
  const userWhere = () => ({
    enrollment: {
      programId: scope.programId,
      status: "active",
      program: access(),
    },
  });
  const filter = (model: string): Args => {
    if (model === "program") return { id: scope.programId, ...access() };
    if (model === "participantEnrollment")
      return {
        programId: scope.programId,
        status: "active",
        program: access(),
      };
    if (ownModels.has(model))
      return {
        programId: scope.programId,
        program: access(),
        ...(["case", "payoutRequest"].includes(model)
          ? { user: userWhere() }
          : {}),
      };
    if (model === "user") return userWhere();
    if (userModels.has(model)) return { user: userWhere() };
    if (model === "caseNote" || model === "resourceAllocation")
      return { case: { programId: scope.programId, program: access() } };
    if (model === "adminUser")
      return {
        isActive: true,
        memberships: {
          some: {
            programId: scope.programId,
            isActive: true,
            revokedAt: null,
            program: access(),
          },
        },
      };
    throw new ScopeError();
  };
  const relationModels: Record<string, Record<string, string>> = {
    user: {
      payoutRequests: "payoutRequest",
      cases: "case",
      progress: "progress",
      consents: "consentRecord",
      rewardEntries: "rewardEntry",
      lessonAttempts: "lessonAttempt",
      lessonReviews: "lessonReview",
      pathSelections: "pathSelection",
      lessonVisits: "lessonVisit",
    },
    case: { notes: "caseNote", allocations: "resourceAllocation" },
    payoutRequest: { rewardEntries: "rewardEntry" },
  };
  function scopeRelations(model: string, args: Args) {
    for (const selector of ["include", "select"]) {
      const tree = args[selector] as Args | undefined;
      if (!tree) continue;
      const copy = { ...tree };
      for (const [relation, nestedModel] of Object.entries(
        relationModels[model] ?? {},
      )) {
        if (!copy[relation]) continue;
        const nested =
          copy[relation] === true ? {} : { ...(copy[relation] as Args) };
        nested.where = { AND: [nested.where ?? {}, filter(nestedModel)] };
        scopeRelations(nestedModel, nested);
        copy[relation] = nested;
      }
      if (copy._count && typeof copy._count === "object") {
        const count = { ...(copy._count as Args) },
          select = { ...(count.select as Args) };
        for (const [relation, nestedModel] of Object.entries(
          relationModels[model] ?? {},
        ))
          if (select[relation])
            select[relation] = {
              where: {
                AND: [
                  (select[relation] as Args)?.where ?? {},
                  filter(nestedModel),
                ],
              },
            };
        count.select = select;
        copy._count = count;
      }
      args[selector] = copy;
    }
  }
  const lookup = async (model: string, id: string) => {
    const delegate = Reflect.get(db, model) as {
      findFirst: (args: Args) => Promise<unknown>;
    };
    if (
      !(await delegate.findFirst({
        where: { id, ...filter(model) },
        select: { id: true },
      }))
    )
      throw new ScopeError(404, "Record not found in your active program.");
  };
  const delegateCache = new Map<string, unknown>();
  return new Proxy(db, {
    get(target, prop) {
      if (prop === "$transaction")
        return async (
          work: (tx: Prisma.TransactionClient) => Promise<unknown>,
          options?: object,
        ) => {
          if (typeof work !== "function") throw new ScopeError();
          return prisma.$transaction(
            (tx) => work(scopedDb(scope, tx)),
            options,
          );
        };
      if (typeof prop !== "string") return Reflect.get(target, prop);
      if (prop.startsWith("$")) {
        if (prop !== "$queryRaw")
          throw new ScopeError(
            403,
            "Raw queries are unavailable in scoped staff operations.",
          );
        return async (...args: unknown[]) => {
          const sql = Array.isArray(args[0]) ? args[0].join("?") : "";
          if (
            !/^SELECT (pg_advisory_xact_lock(?:_shared)?\(74219932\)::text|"id" FROM "(?:User|PoolBalance|Case|Program)" WHERE "(?:id|programId)"=\? FOR UPDATE)$/.test(
              sql,
            )
          )
            throw new ScopeError();
          if (sql.includes('FROM "User"') && typeof args[1] === "string")
            await lookup("user", args[1]);
          if (sql.includes('FROM "Program"') && args[1] !== scope.programId)
            throw new ScopeError();
          return Reflect.apply(Reflect.get(target, prop), target, args);
        };
      }
      if (delegateCache.has(prop)) return delegateCache.get(prop);
      if (
        !ownModels.has(prop) &&
        !userModels.has(prop) &&
        !sharedModels.has(prop) &&
        ![
          "user",
          "adminUser",
          "caseNote",
          "resourceAllocation",
          "program",
          "participantEnrollment",
        ].includes(prop)
      )
        throw new ScopeError();
      const delegate = Reflect.get(target, prop);
      const proxy = new Proxy(delegate, {
        get(modelTarget, operation) {
          if (typeof operation !== "string")
            return Reflect.get(modelTarget, operation);
          return async (input: Args = {}) => {
            if (
              !reads.has(operation) &&
              typeof Reflect.get(db, "$transaction") === "function"
            ) {
              return prisma.$transaction((tx) => {
                const client = scopedDb(scope, tx) as unknown as Record<
                  string,
                  Record<string, (args: Args) => Promise<unknown>>
                >;
                return client[prop][operation](input);
              });
            }
            if (!reads.has(operation)) await lockStaffScope(db, scope);
            const args = { ...input };
            scopeRelations(prop, args);
            if (
              prop === "learnerSession" &&
              (operation !== "updateMany" ||
                Object.keys((args.data as Args) ?? {}).some(
                  (k) => k !== "revokedAt",
                ))
            )
              throw new ScopeError();
            if (sharedModels.has(prop)) {
              if (!reads.has(operation)) throw new ScopeError();
              noPrivateSharedIncludes(args);
            } else {
              if (
                !reads.has(operation) &&
                !["create", "update", "updateMany", "upsert"].includes(
                  operation,
                )
              )
                throw new ScopeError();
              if (
                [
                  "adminUser",
                  "participantEnrollment",
                  "staffMembership",
                ].includes(prop) &&
                !reads.has(operation)
              )
                throw new ScopeError();
              if (
                args.where &&
                typeof args.where === "object" &&
                prop === "poolBalance"
              ) {
                const where = { ...(args.where as Args) };
                if (where.id === "singleton") {
                  delete where.id;
                  where.programId = scope.programId;
                }
                args.where = where;
              }
              if (operation !== "create") {
                const where = (args.where as Args) ?? {};
                args.where = {
                  ...where,
                  AND: [
                    ...(Array.isArray(where.AND)
                      ? where.AND
                      : where.AND
                        ? [where.AND]
                        : []),
                    filter(prop),
                  ],
                };
              }
              for (const key of ["data", "create", "update"]) {
                if (!args[key]) continue;
                const data = { ...(args[key] as Args) };
                if (prop === "program") {
                  const moneyKeys = ["defaultConfigSlug"],
                    supportKeys = [
                      "supportEnabled",
                      "supportTeamName",
                      "supportMonitoring",
                      "supportRegion",
                      "supportReviewReference",
                      "supportVersion",
                    ];
                  const allowed =
                    scope.role === "admin"
                      ? [...moneyKeys, ...supportKeys]
                      : scope.role === "finance"
                        ? moneyKeys
                        : [];
                  if (
                    operation !== "update" ||
                    Object.keys(data).some((k) => !allowed.includes(k))
                  )
                    throw new ScopeError();
                }
                if (
                  prop === "program" &&
                  typeof data.defaultConfigSlug === "string"
                ) {
                  const config = await db.payoutConfig.findFirst({
                    where: {
                      programId: scope.programId,
                      programSlug: data.defaultConfigSlug,
                    },
                  });
                  if (!config) throw new ScopeError();
                }
                if (
                  Object.values(data).some(
                    (v) =>
                      v &&
                      typeof v === "object" &&
                      [
                        "connect",
                        "create",
                        "upsert",
                        "delete",
                        "disconnect",
                        "connectOrCreate",
                      ].some((k) => k in v),
                  )
                )
                  throw new ScopeError(
                    403,
                    "Nested relationship writes need a reviewed workflow.",
                  );
                if ("programId" in data && data.programId !== scope.programId)
                  throw new ScopeError();
                if (
                  ownModels.has(prop) &&
                  (operation === "create" || key === "create")
                )
                  data.programId = scope.programId;
                if (prop === "poolBalance" && data.id === "singleton")
                  data.id = scope.programId;
                for (const [foreign, model] of [
                  ["userId", "user"],
                  ["caseId", "case"],
                  ["payoutId", "payoutRequest"],
                  ["assignedToId", "adminUser"],
                ]) {
                  if (typeof data[foreign] === "string")
                    await lookup(model, data[foreign] as string);
                }
                args[key] = data;
              }
              // Update/create must still prove a live scope; no grant from a stale UI/session.
              if (!reads.has(operation)) {
                const allowed = await db.staffMembership.findFirst({
                  where: {
                    adminId: scope.id,
                    programId: scope.programId,
                    isActive: true,
                    revokedAt: null,
                    program: access(),
                  },
                });
                if (!allowed) throw new ScopeError();
              }
            }
            try {
              return await Reflect.apply(
                Reflect.get(modelTarget, operation),
                modelTarget,
                [args],
              );
            } catch (e) {
              if (
                e &&
                typeof e === "object" &&
                "code" in e &&
                e.code === "P2025"
              )
                throw new ScopeError(
                  (input.where as Args)?.version !== undefined ||
                  (input.where as Args)?.staffVersion !== undefined
                    ? 409
                    : 404,
                  (input.where as Args)?.version !== undefined ||
                  (input.where as Args)?.staffVersion !== undefined
                    ? "This record changed while you were editing. Reload and review the latest version."
                    : "Record not found in your active program.",
                );
              throw e;
            }
          };
        },
      });
      delegateCache.set(prop, proxy);
      return proxy;
    },
  }) as PrismaClient;
}
