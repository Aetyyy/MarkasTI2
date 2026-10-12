import { prisma } from "@/libs/prisma";
import { PERMISSION_SCOPES } from "@/libs/auth/access";
import { ensurePermissionScopeCatalog } from "@/libs/auth/scopeCatalog";

const DEFAULT_NAVIGATION = [
  {
    title: "Utama",
    icon: "home",
    items: [
      ["Dashboard", "Ringkasan admin", "/admin/dashboard", "home", PERMISSION_SCOPES.dashboard],
      ["Activity Log", "Riwayat sistem", "/admin/activity-log", "activity", PERMISSION_SCOPES.activityLog],
      ["Changelogs", "Kelola update website", "/admin/changelogs", "activity", PERMISSION_SCOPES.changelogs],
      ["Pengumuman", "Kelola papan informasi", "/admin/announcements", "bell", PERMISSION_SCOPES.announcements],
      ["Users", "Kelola akun", "/admin/users", "users", PERMISSION_SCOPES.users],
      ["Teams", "Kelola team", "/admin/teams", "team", PERMISSION_SCOPES.teams],
    ],
  },
  {
    title: "Akademik",
    icon: "layers",
    items: [
      ["Data Dosen", "Kelola dosen", "/admin/dosen", "book", PERMISSION_SCOPES.dosen],
      ["Jadwal", "Jadwal per dosen", "/admin/schedules", "calendar", PERMISSION_SCOPES.schedules],
      ["Kehadiran", "Absensi dosen", "/admin/attendance", "attendance", PERMISSION_SCOPES.attendance],
      ["Struktur Kelas", "Pengurus kelas", "/admin/struktur", "layers", PERMISSION_SCOPES.classStructure],
    ],
  },
  {
    title: "Akses Sistem",
    icon: "shield",
    items: [
      ["Roles", "Kelola role", "/admin/roles", "shield", PERMISSION_SCOPES.roles],
      ["Permissions", "Kelola permission", "/admin/permissions", "lock", PERMISSION_SCOPES.permissions],
      ["Menu Sidebar", "Atur menu dan akses", "/admin/navigation", "menu", PERMISSION_SCOPES.navigation],
    ],
  },
  {
    title: "Keuangan",
    icon: "credit-card",
    items: [
      ["Kas Masuk", "Pemasukan kas", "/admin/kas-masuk", "dollar", PERMISSION_SCOPES.cashIncome],
      ["Kas Keluar", "Pengeluaran kas", "/admin/kas-keluar", "credit-card", PERMISSION_SCOPES.cashExpense],
    ],
  },
] as const;

export async function ensureNavigationDefaults() {
  await ensurePermissionScopeCatalog();

  for (let categoryIndex = 0; categoryIndex < DEFAULT_NAVIGATION.length; categoryIndex += 1) {
    const categoryDefinition = DEFAULT_NAVIGATION[categoryIndex];
    let category = await prisma.sidebarCategory.findFirst({
      where: { title: categoryDefinition.title },
      orderBy: { createdAt: "asc" },
    });

    if (!category) {
      category = await prisma.sidebarCategory.create({
        data: {
          title: categoryDefinition.title,
          icon: categoryDefinition.icon,
          sortOrder: categoryIndex,
        },
      });
    }

    for (let itemIndex = 0; itemIndex < categoryDefinition.items.length; itemIndex += 1) {
      const [label, description, href, icon, scopeName] = categoryDefinition.items[itemIndex];
      const scope = scopeName
        ? await prisma.permissionScope.findUnique({ where: { name: scopeName } })
        : null;

      const existingItem = await prisma.sidebarItem.findUnique({
        where: { href },
        select: { id: true },
      });

      if (existingItem) {
        await prisma.sidebarItem.update({
          where: { id: existingItem.id },
          data: {
            requiredScopeId: scope?.id,
            requiredAction: scope ? "read" : null,
          },
        });
      } else {
        await prisma.sidebarItem.create({
          data: {
            label,
            description,
            href,
            icon,
            sortOrder: itemIndex,
            categoryId: category.id,
            requiredScopeId: scope?.id,
            requiredAction: scope ? "read" : null,
          },
        });
      }
    }
  }
}
