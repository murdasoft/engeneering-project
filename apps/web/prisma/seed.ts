import { PrismaClient } from "../app/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Test1234!", 12);

  const users = [
    { email: "engineer@inspectai.dev", name: "Test Engineer", role: "ENGINEER" as const },
    { email: "manager@inspectai.dev", name: "Test Manager", role: "MANAGER" as const },
    { email: "admin@inspectai.dev", name: "Test Admin", role: "ADMIN" as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
      },
    });
    console.log(`Created: ${u.email} (${u.role})`);
  }

  console.log("\nSeed complete! Test accounts:");
  console.log("  engineer@inspectai.dev / Test1234!");
  console.log("  manager@inspectai.dev  / Test1234!");
  console.log("  admin@inspectai.dev    / Test1234!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
