import { boundedDatabaseUrl } from "./reliability/database-url";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const url = boundedDatabaseUrl(process.env.DATABASE_URL);
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  ...(url ? { datasources: { db: { url } } } : {}),
  transactionOptions: { maxWait: 5000, timeout: 15000 },
  log: [],
  errorFormat: "minimal",
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
