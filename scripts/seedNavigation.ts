import { ensureNavigationDefaults } from "../src/libs/navigation/defaults";
import { prisma } from "../src/libs/prisma";

async function main() {
  await ensureNavigationDefaults();
  console.log("Sidebar navigation defaults are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
