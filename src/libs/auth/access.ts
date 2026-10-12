export type PermissionAction = "create" | "read" | "update" | "delete";

export const PERMISSION_SCOPES = {
  dashboard: "dashboard",
  activityLog: "activity_log",
  changelogs: "changelogs",
  announcements: "announcements",
  users: "users",
  teams: "teams",
  roles: "roles",
  permissions: "permissions",
  navigation: "navigation",
  schedules: "schedules",
  gallery: "gallery",
  classStructure: "struktur",
  cashIncome: "kas_masuk",
  cashExpense: "kas_keluar",
  dosen: "dosen",
  attendance: "attendance",
  tasks: "tasks",
  chat: "chat",
} as const;

export type PermissionScopeName =
  (typeof PERMISSION_SCOPES)[keyof typeof PERMISSION_SCOPES];

export const ADMIN_ROUTE_ACCESS = [
  { href: "/admin/dashboard", scope: PERMISSION_SCOPES.dashboard },
  { href: "/admin/activity-log", scope: PERMISSION_SCOPES.activityLog },
  { href: "/admin/changelogs", scope: PERMISSION_SCOPES.changelogs },
  { href: "/admin/announcements", scope: PERMISSION_SCOPES.announcements },
  { href: "/admin/dosen", scope: PERMISSION_SCOPES.dosen },
  { href: "/admin/schedules", scope: PERMISSION_SCOPES.schedules },
  { href: "/admin/users", scope: PERMISSION_SCOPES.users },
  { href: "/admin/teams", scope: PERMISSION_SCOPES.teams },
  { href: "/admin/roles", scope: PERMISSION_SCOPES.roles },
  { href: "/admin/permissions", scope: PERMISSION_SCOPES.permissions },
  { href: "/admin/navigation", scope: PERMISSION_SCOPES.navigation },
  { href: "/admin/struktur", scope: PERMISSION_SCOPES.classStructure },
  { href: "/admin/attendance", scope: PERMISSION_SCOPES.attendance },
  { href: "/admin/kas-masuk", scope: PERMISSION_SCOPES.cashIncome },
  { href: "/admin/kas-keluar", scope: PERMISSION_SCOPES.cashExpense },
] as const;

export type AccessPermission = {
  name: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

export type AccessUser = {
  roles?: string[];
  permissions?: AccessPermission[];
};

const SUPER_ADMIN_ROLES = ["admin", "administrator", "super_admin"];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function isSuperAdminRole(roles?: string[]) {
  if (!roles || roles.length === 0) return false;

  return roles.some((role) => SUPER_ADMIN_ROLES.includes(normalize(role)));
}

export function hasAssignedRole(user: AccessUser | null | undefined) {
  return Boolean(user?.roles?.some((role) => role.trim().length > 0));
}

export function canAccess(
  user: AccessUser | null | undefined,
  scopeName: string,
  action: PermissionAction,
) {
  if (!user) return false;

  if (isSuperAdminRole(user.roles)) {
    return true;
  }

  const targetScope = normalize(scopeName);

  const permission = user.permissions?.find(
    (item) => normalize(item.name) === targetScope,
  );

  if (!permission) return false;

  return Boolean(permission[action]);
}

export function getCrudAccess(
  user: AccessUser | null | undefined,
  scopeName: string,
) {
  return {
    create: canAccess(user, scopeName, "create"),
    read: canAccess(user, scopeName, "read"),
    update: canAccess(user, scopeName, "update"),
    delete: canAccess(user, scopeName, "delete"),
  };
}

export function getAdminLandingPath(user: AccessUser | null | undefined) {
  if (!hasAssignedRole(user)) return "/";

  return (
    ADMIN_ROUTE_ACCESS.find((route) => canAccess(user, route.scope, "read"))
      ?.href ?? "/unauthorized"
  );
}

export function getAllowedLoginTarget(
  user: AccessUser | null | undefined,
  requestedPath?: string | null,
) {
  if (!hasAssignedRole(user)) return "/";

  if (requestedPath?.startsWith("/admin")) {
    const route = ADMIN_ROUTE_ACCESS.find(
      (item) =>
        requestedPath === item.href ||
        requestedPath.startsWith(`${item.href}/`),
    );

    if (route && canAccess(user, route.scope, "read")) {
      return requestedPath;
    }

    return getAdminLandingPath(user);
  }

  return requestedPath?.startsWith("/")
    ? requestedPath
    : getAdminLandingPath(user);
}
