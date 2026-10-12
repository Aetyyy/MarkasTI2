import { prisma } from "@/libs/prisma";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

export const PERMISSION_SCOPE_CATALOG = [
  { name: PERMISSION_SCOPES.dashboard, description: "Melihat ringkasan dashboard admin" },
  { name: PERMISSION_SCOPES.activityLog, description: "Melihat riwayat aktivitas sistem" },
  { name: PERMISSION_SCOPES.changelogs, description: "Mengelola changelog pembaruan website" },
  { name: PERMISSION_SCOPES.announcements, description: "Mengelola pengumuman portal" },
  { name: PERMISSION_SCOPES.users, description: "Mengelola akun pengguna" },
  { name: PERMISSION_SCOPES.teams, description: "Mengelola data dan tampilan team" },
  { name: PERMISSION_SCOPES.roles, description: "Mengelola role dan hak aksesnya" },
  { name: PERMISSION_SCOPES.permissions, description: "Mengelola daftar permission scope" },
  { name: PERMISSION_SCOPES.navigation, description: "Mengelola menu sidebar dan visibilitasnya" },
  { name: PERMISSION_SCOPES.schedules, description: "Mengelola jadwal perkuliahan" },
  { name: PERMISSION_SCOPES.dosen, description: "Mengelola dosen dan mata kuliah" },
  { name: PERMISSION_SCOPES.attendance, description: "Mengelola data kehadiran" },
  { name: PERMISSION_SCOPES.classStructure, description: "Mengelola struktur kelas" },
  { name: PERMISSION_SCOPES.cashIncome, description: "Mengelola transaksi kas masuk" },
  { name: PERMISSION_SCOPES.cashExpense, description: "Mengelola transaksi kas keluar" },
  { name: PERMISSION_SCOPES.gallery, description: "Mengelola unggahan gallery" },
  { name: PERMISSION_SCOPES.tasks, description: "Mengelola task reminder" },
  { name: PERMISSION_SCOPES.chat, description: "Mengelola global chat" },
] as const;

export async function ensurePermissionScopeCatalog() {
  await Promise.all(
    PERMISSION_SCOPE_CATALOG.map((scope) =>
      prisma.permissionScope.upsert({
        where: { name: scope.name },
        create: scope,
        update: {},
      }),
    ),
  );

  const legacyScopes = await prisma.permissionScope.findMany({
    where: { name: { in: ["all", "cash"] } },
    include: {
      rolePermissions: true,
      userPermissions: true,
      _count: { select: { sidebarItems: true } },
    },
  });

  if (legacyScopes.length === 0) return;

  const targetScopes = await prisma.permissionScope.findMany({
    where: { name: { in: Object.values(PERMISSION_SCOPES) } },
    select: { id: true, name: true },
  });

  for (const legacy of legacyScopes) {
    const targets =
      legacy.name === "all"
        ? targetScopes
        : targetScopes.filter((scope) =>
            [PERMISSION_SCOPES.cashIncome, PERMISSION_SCOPES.cashExpense].includes(
              scope.name as
                | typeof PERMISSION_SCOPES.cashIncome
                | typeof PERMISSION_SCOPES.cashExpense,
            ),
          );

    for (const target of targets) {
      for (const permission of legacy.rolePermissions) {
        const existing = await prisma.rolePermission.findUnique({
          where: {
            roleId_scopeId: {
              roleId: permission.roleId,
              scopeId: target.id,
            },
          },
        });

        await prisma.rolePermission.upsert({
          where: {
            roleId_scopeId: {
              roleId: permission.roleId,
              scopeId: target.id,
            },
          },
          create: {
            roleId: permission.roleId,
            scopeId: target.id,
            canCreate: permission.canCreate,
            canRead: permission.canRead,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
          },
          update: {
            canCreate: Boolean(existing?.canCreate || permission.canCreate),
            canRead: Boolean(existing?.canRead || permission.canRead),
            canUpdate: Boolean(existing?.canUpdate || permission.canUpdate),
            canDelete: Boolean(existing?.canDelete || permission.canDelete),
          },
        });
      }

      for (const permission of legacy.userPermissions) {
        const existing = await prisma.userPermission.findUnique({
          where: {
            userId_scopeId: {
              userId: permission.userId,
              scopeId: target.id,
            },
          },
        });

        await prisma.userPermission.upsert({
          where: {
            userId_scopeId: {
              userId: permission.userId,
              scopeId: target.id,
            },
          },
          create: {
            userId: permission.userId,
            scopeId: target.id,
            canCreate: permission.canCreate,
            canRead: permission.canRead,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
          },
          update: {
            canCreate: Boolean(existing?.canCreate || permission.canCreate),
            canRead: Boolean(existing?.canRead || permission.canRead),
            canUpdate: Boolean(existing?.canUpdate || permission.canUpdate),
            canDelete: Boolean(existing?.canDelete || permission.canDelete),
          },
        });
      }
    }
  }

  const removableScopeIds = legacyScopes
    .filter((scope) => scope._count.sidebarItems === 0)
    .map((scope) => scope.id);

  if (removableScopeIds.length > 0) {
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({
        where: { scopeId: { in: removableScopeIds } },
      }),
      prisma.userPermission.deleteMany({
        where: { scopeId: { in: removableScopeIds } },
      }),
      prisma.permissionScope.deleteMany({
        where: { id: { in: removableScopeIds } },
      }),
    ]);
  }
}
