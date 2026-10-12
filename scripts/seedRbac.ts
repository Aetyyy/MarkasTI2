import { PrismaClient } from "@prisma/client";
import { PERMISSION_SCOPES } from "../src/libs/auth/access";

const prisma = new PrismaClient();

const scopes = [
  { name: PERMISSION_SCOPES.dashboard, description: "Akses dashboard admin." },
  { name: PERMISSION_SCOPES.activityLog, description: "Akses activity log." },
  { name: PERMISSION_SCOPES.changelogs, description: "Akses pengelolaan changelog." },
  {
    name: PERMISSION_SCOPES.users,
    description: "Akses untuk mengelola user.",
  },
  { name: PERMISSION_SCOPES.teams, description: "Akses untuk mengelola team." },
  {
    name: PERMISSION_SCOPES.roles,
    description: "Akses untuk mengelola role.",
  },
  {
    name: PERMISSION_SCOPES.permissions,
    description: "Akses untuk mengelola permission scope.",
  },
  { name: PERMISSION_SCOPES.navigation, description: "Akses untuk mengelola navigasi." },
  {
    name: PERMISSION_SCOPES.schedules,
    description: "Akses untuk mengelola jadwal.",
  },
  { name: PERMISSION_SCOPES.dosen, description: "Akses untuk mengelola dosen." },
  { name: PERMISSION_SCOPES.attendance, description: "Akses untuk mengelola kehadiran." },
  { name: PERMISSION_SCOPES.classStructure, description: "Akses struktur kelas." },
  { name: PERMISSION_SCOPES.cashIncome, description: "Akses kas masuk." },
  { name: PERMISSION_SCOPES.cashExpense, description: "Akses kas keluar." },
  { name: PERMISSION_SCOPES.gallery, description: "Akses pengelolaan gallery." },
  { name: PERMISSION_SCOPES.tasks, description: "Akses pengelolaan task." },
  { name: PERMISSION_SCOPES.chat, description: "Akses pengelolaan chat." },
];

async function upsertRolePermission(params: {
  roleId: string;
  scopeId: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}) {
  await prisma.rolePermission.upsert({
    where: {
      roleId_scopeId: {
        roleId: params.roleId,
        scopeId: params.scopeId,
      },
    },
    update: {
      canCreate: params.create,
      canRead: params.read,
      canUpdate: params.update,
      canDelete: params.delete,
    },
    create: {
      roleId: params.roleId,
      scopeId: params.scopeId,
      canCreate: params.create,
      canRead: params.read,
      canUpdate: params.update,
      canDelete: params.delete,
    },
  });
}

async function main() {
  const permissionScopes = [];

  for (const scope of scopes) {
    const permissionScope = await prisma.permissionScope.upsert({
      where: {
        name: scope.name,
      },
      update: {
        description: scope.description,
      },
      create: {
        name: scope.name,
        description: scope.description,
      },
    });

    permissionScopes.push(permissionScope);
  }

  const adminRole = await prisma.roles.upsert({
    where: {
      name: "Admin",
    },
    update: {},
    create: {
      name: "Admin",
    },
  });

  const ketuaRole = await prisma.roles.upsert({
    where: {
      name: "Ketua Kelas",
    },
    update: {},
    create: {
      name: "Ketua Kelas",
    },
  });

  for (const scope of permissionScopes) {
    await upsertRolePermission({
      roleId: adminRole.id,
      scopeId: scope.id,
      create: true,
      read: true,
      update: true,
      delete: true,
    });
  }

  const schedulesScope = permissionScopes.find(
    (scope) => scope.name === PERMISSION_SCOPES.schedules,
  );

  if (schedulesScope) {
    await upsertRolePermission({
      roleId: ketuaRole.id,
      scopeId: schedulesScope.id,
      create: true,
      read: true,
      update: true,
      delete: false,
    });
  }

  console.log("RBAC default berhasil dibuat.");
  console.log(
    "Permission scope:",
    permissionScopes.map((item) => item.name),
  );
  console.log("Role Admin: full access.");
  console.log("Role Ketua Kelas: schedules create/read/update.");
}

main()
  .catch((error) => {
    console.error("Gagal seed RBAC:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
