import "server-only";

import { prisma } from "@/libs/prisma";
import { requirePermission } from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";
import type { RoleOption, UserForClient } from "@/types/userManagement";

export async function getAllUsersForAdmin(): Promise<UserForClient[]> {
  await requirePermission(PERMISSION_SCOPES.users, "read");

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      roles: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    nim: user.nim,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: user.roles.map((role) => ({
      id: role.id,
      name: role.name,
    })),
  }));
}

export async function getAllRolesForAdmin(): Promise<RoleOption[]> {
  await requirePermission(PERMISSION_SCOPES.users, "read");

  const roles = await prisma.roles.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  return roles;
}
