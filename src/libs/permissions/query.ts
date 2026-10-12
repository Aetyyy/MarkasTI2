import "server-only";

import { prisma } from "@/libs/prisma";
import { requirePermission } from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";
import { ensurePermissionScopeCatalog } from "@/libs/auth/scopeCatalog";
import type { PermissionScopeForClient } from "@/types/permissionManagement";

export async function getPermissionScopesForAdmin(): Promise<
  PermissionScopeForClient[]
> {
  await requirePermission(PERMISSION_SCOPES.permissions, "read");
  await ensurePermissionScopeCatalog();

  const scopes = await prisma.permissionScope.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return scopes.map((scope) => ({
    id: scope.id,
    name: scope.name,
    description: scope.description,
    createdAt: scope.createdAt.toISOString(),
    updatedAt: scope.updatedAt.toISOString(),
  }));
}
