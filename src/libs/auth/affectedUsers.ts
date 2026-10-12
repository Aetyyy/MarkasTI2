import "server-only";

import { prisma } from "@/libs/prisma";

function uniqueArray(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function getUserIdsByRoleId(roleId: string): Promise<string[]> {
  if (!roleId) return [];

  const role = await prisma.roles.findUnique({
    where: {
      id: roleId,
    },
    select: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  return role?.user.map((user) => user.id) ?? [];
}

export async function getUserIdsByRoleIds(
  roleIds: string[],
): Promise<string[]> {
  const safeRoleIds = uniqueArray(roleIds);

  if (safeRoleIds.length === 0) return [];

  const roles = await prisma.roles.findMany({
    where: {
      id: {
        in: safeRoleIds,
      },
    },
    select: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  const userIds = new Set<string>();

  roles.forEach((role) => {
    role.user.forEach((user) => {
      userIds.add(user.id);
    });
  });

  return Array.from(userIds);
}

export async function getUserIdsByPermissionScopeId(
  scopeId: string,
): Promise<string[]> {
  if (!scopeId) return [];

  const [directPermissions, rolePermissions] = await Promise.all([
    prisma.userPermission.findMany({
      where: {
        scopeId,
      },
      select: {
        userId: true,
      },
    }),

    prisma.rolePermission.findMany({
      where: {
        scopeId,
      },
      select: {
        roleId: true,
      },
    }),
  ]);

  const directUserIds = directPermissions.map(
    (permission) => permission.userId,
  );
  const roleIds = rolePermissions.map((permission) => permission.roleId);
  const roleUserIds = await getUserIdsByRoleIds(roleIds);

  return uniqueArray([...directUserIds, ...roleUserIds]);
}

export async function getUserIdsByPermissionScopeIds(
  scopeIds: string[],
): Promise<string[]> {
  const safeScopeIds = uniqueArray(scopeIds);

  if (safeScopeIds.length === 0) return [];

  const [directPermissions, rolePermissions] = await Promise.all([
    prisma.userPermission.findMany({
      where: {
        scopeId: {
          in: safeScopeIds,
        },
      },
      select: {
        userId: true,
      },
    }),

    prisma.rolePermission.findMany({
      where: {
        scopeId: {
          in: safeScopeIds,
        },
      },
      select: {
        roleId: true,
      },
    }),
  ]);

  const directUserIds = directPermissions.map(
    (permission) => permission.userId,
  );
  const roleIds = rolePermissions.map((permission) => permission.roleId);
  const roleUserIds = await getUserIdsByRoleIds(roleIds);

  return uniqueArray([...directUserIds, ...roleUserIds]);
}
