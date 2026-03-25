import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!defaultPassword) {
    throw new Error("ADMIN_DEFAULT_PASSWORD environment variable is required to seed the admin account.");
  }
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: "admin@learn2earn.org" },
    update: {},
    create: {
      email: "admin@learn2earn.org",
      passwordHash,
      fullName: "System Administrator",
      role: "admin",
    },
  });

  console.log("✅ Default admin account created");
  console.log("   Email: admin@learn2earn.org");
  console.log("   ⚠️  Change the default password immediately after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
