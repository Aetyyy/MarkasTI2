import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const nim = process.env.BOOTSTRAP_ADMIN_NIM?.trim();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!name || !nim || !email || !password) {
    throw new Error(
      "Atur BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_NIM, BOOTSTRAP_ADMIN_EMAIL, dan BOOTSTRAP_ADMIN_PASSWORD sebelum menjalankan seed admin.",
    );
  }

  const adminData = {
    name,
    nim,
    email,
    password,
    roleName: "Admin",
  };

  const hashedPassword = await hash(adminData.password, 10);

  const adminRole = await prisma.roles.upsert({
    where: {
      name: adminData.roleName,
    },
    update: {},
    create: {
      name: adminData.roleName,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: {
      nim: adminData.nim,
    },
    update: {
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      roles: {
        set: [
          {
            id: adminRole.id,
          },
        ],
      },
    },
    create: {
      name: adminData.name,
      nim: adminData.nim,
      email: adminData.email,
      password: hashedPassword,
      roles: {
        connect: [
          {
            id: adminRole.id,
          },
        ],
      },
    },
    select: {
      id: true,
      name: true,
      nim: true,
      email: true,
      roles: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log("Admin berhasil dibuat / diperbarui.");
  console.log("-----------------------------------");
  console.log("Nama     :", adminUser.name);
  console.log("NIM      :", adminUser.nim);
  console.log("Email    :", adminUser.email);
  console.log(
    "Role     :",
    adminUser.roles.map((role) => role.name).join(", "),
  );
  console.log("Password :", "(disembunyikan)");
  console.log("-----------------------------------");
}

main()
  .catch((error) => {
    console.error("Gagal membuat admin:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
