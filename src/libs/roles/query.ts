import "server-only";

import { prisma } from "@/libs/prisma";
import { requirePermission } from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";
import type {
  PermissionScopeOption,
  RoleWithPermissionsForClient,
} from "@/types/roleManagement";
import { cacheDatabaseRead } from "@/libs/serverCache";

export async function getRolesWithPermissionsForAdmin(): Promise<
  RoleWithPermissionsForClient[]
> {
  await requirePermission(PERMISSION_SCOPES.roles, "read");

  return cacheDatabaseRead("roles-with-permissions", async () => {
  const roles = await prisma.roles.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      rolePermissions: {
        where: {
          scope: { name: { notIn: ["all", "cash"] } },
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          scope: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    permissions: role.rolePermissions
      .map((permission) => ({
        id: permission.id,
        scopeId: permission.scope.id,
        name: permission.scope.name,
        create: permission.canCreate,
        read: permission.canRead,
        update: permission.canUpdate,
        delete: permission.canDelete,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
  }, 15);
}

export async function getPermissionScopeOptionsForAdmin(): Promise<
  PermissionScopeOption[]
> {
  await requirePermission(PERMISSION_SCOPES.roles, "read");

  return cacheDatabaseRead("role-permission-scope-options", async () => prisma.permissionScope.findMany({
    where: {
      name: { notIn: ["all", "cash"] },
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  }), 15);
}
