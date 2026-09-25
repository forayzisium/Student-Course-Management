import "dotenv/config";
import { prisma } from "../src/config/prisma";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email)
    throw new Error(
      "Usage: npx tsx scripts/setup-admin-access.ts <existing-owner-email>",
    );
  await prisma.$transaction(async (tx) => {
    const owner = await tx.user.findUnique({ where: { email } });
    if (!owner || owner.role !== "ADMIN" || owner.status !== "ACTIVE") {
      throw new Error(
        "The owner must already be an active ADMIN. No accounts were changed.",
      );
    }
    const otherOwner = await tx.user.findFirst({
      where: { isSuperAdmin: true, id: { not: owner.id } },
    });
    if (otherOwner)
      throw new Error(
        "A different superadmin already exists. Review the owner configuration manually.",
      );
    if (!owner.isSuperAdmin) {
      await tx.user.update({
        where: { id: owner.id },
        data: { isSuperAdmin: true },
      });
      await tx.adminAccessAudit.create({
        data: {
          actorId: owner.id,
          email: owner.email,
          action: "SUPERADMIN_CONFIGURED",
        },
      });
    }
    console.log(`Superadmin configured for existing user #${owner.id}.`);
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Setup failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
