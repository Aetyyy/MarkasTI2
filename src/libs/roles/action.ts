"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/libs/prisma";
import type { RoleActionResult } from "@/types/roleManagement";
import { getUserIdsByRoleId } from "@/libs/auth/affectedUsers";
import { invalidateAuthUserPayloads } from "@/libs/auth/userPayload";
import { broadcastAuthSessionChanged } from "@/libs/realtime/authRealtime";
import {
  getAuthorizationErrorMessage,
  requirePermission,
} from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

const ADMIN_ROLES_PATH = "/admin/roles";
const ADMIN_USERS_PATH = "/admin/users";

type PermissionScopeInput = {
  scopeId: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getErrorMessage(error: unknown) {
  const accessMessage = getAuthorizationErrorMessage(error);

  if (accessMessage) {
    return accessMessage;
  }

  if (error instanceof Error && error.message.startsWith("APP_ERROR:")) {
    return error.message.replace("APP_ERROR:", "").trim();
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Data sudah terdaftar.";
    }

    if (error.code === "P2025") {
      return "Data tidak ditemukan.";
    }

    if (error.code === "P2003") {
      return "Data tidak bisa dihapus karena masih terhubung dengan data lain.";
    }
  }

  return "Terjadi kesalahan pada server.";
}

function parsePermissionScopes(formData: FormData): {
  success: boolean;
  message?: string;
  data?: PermissionScopeInput[];
} {
  const raw = getFormString(formData, "permissionScopesJson");

  if (!raw) {
    return {
      success: false,
      message: "Permission scope tidak boleh kosong.",
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      success: false,
      message: "Format permission scope tidak valid.",
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      success: false,
      message: "Format permission scope harus berupa array.",
    };
  }

  const scopes = parsed.map((item) => {
    const scope = item as Partial<PermissionScopeInput>;

    const create = Boolean(scope.create);
    const update = Boolean(scope.update);
    const canDelete = Boolean(scope.delete);

    return {
      scopeId: String(scope.scopeId || "").trim(),
      create,
      read: Boolean(scope.read) || create || update || canDelete,
      update,
      delete: canDelete,
    };
  });

  if (scopes.length === 0) {
    return {
      success: false,
      message: "Minimal pilih satu permission scope.",
    };
  }

  const emptyScope = scopes.find((scope) => !scope.scopeId);

  if (emptyScope) {
    return {
      success: false,
      message: "Ada permission scope yang belum dipilih.",
    };
  }

  const scopeWithoutRight = scopes.find(
    (scope) => !scope.create && !scope.read && !scope.update && !scope.delete,
  );

  if (scopeWithoutRight) {
    return {
      success: false,
      message: "Setiap permission scope harus punya minimal satu hak akses.",
    };
  }

  const scopeIds = scopes.map((scope) => scope.scopeId);
  const uniqueScopeIds = new Set(scopeIds);

  if (scopeIds.length !== uniqueScopeIds.size) {
    return {
      success: false,
      message: "Permission scope tidak boleh duplikat dalam satu role.",
    };
  }

  return {
    success: true,
    data: scopes,
  };
}

export async function saveRoleWithPermissionsAction(
  formData: FormData,
  roleId?: string,
): Promise<RoleActionResult> {
  try {
    await requirePermission(
      PERMISSION_SCOPES.roles,
      roleId ? "update" : "create",
    );

    const roleName = getFormString(formData, "name");
    const parsedScopes = parsePermissionScopes(formData);
    const affectedUserIds = roleId ? await getUserIdsByRoleId(roleId) : [];

    if (!roleName) {
      return {
        success: false,
        message: "Nama role wajib diisi.",
      };
    }

    if (!parsedScopes.success || !parsedScopes.data) {
      return {
        success: false,
        message: parsedScopes.message || "Permission scope tidak valid.",
      };
    }

    const duplicateRole = await prisma.roles.findFirst({
      where: {
        name: roleName,
        ...(roleId
          ? {
              NOT: {
                id: roleId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (duplicateRole) {
      return {
        success: false,
        message: "Role dengan nama tersebut sudah ada.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const role = roleId
        ? await tx.roles.update({
            where: {
              id: roleId,
            },
            data: {
              name: roleName,
            },
            select: {
              id: true,
            },
          })
        : await tx.roles.create({
            data: {
              name: roleName,
            },
            select: {
              id: true,
            },
          });

      await tx.rolePermission.deleteMany({
        where: {
          roleId: role.id,
        },
      });

      for (const scopeInput of parsedScopes.data ?? []) {
        const existingScope = await tx.permissionScope.findUnique({
          where: {
            id: scopeInput.scopeId,
          },
          select: {
            id: true,
          },
        });

        if (!existingScope) {
          throw new Error("APP_ERROR: Permission scope tidak ditemukan.");
        }

        await tx.rolePermission.create({
          data: {
            roleId: role.id,
            scopeId: scopeInput.scopeId,
            canCreate: scopeInput.create,
            canRead: scopeInput.read,
            canUpdate: scopeInput.update,
            canDelete: scopeInput.delete,
          },
        });
      }

    });

    invalidateAuthUserPayloads(affectedUserIds);
    if (affectedUserIds.length > 0) {
      broadcastAuthSessionChanged({
        targetUserIds: affectedUserIds,
        reason: "ROLE_UPDATED",
        message: "Role kamu diperbarui.",
      });
    }

    revalidatePath(ADMIN_ROLES_PATH);
    revalidatePath(ADMIN_USERS_PATH);

    return {
      success: true,
      message: roleId
        ? "Role dan permission berhasil diperbarui."
        : "Role dan permission berhasil dibuat.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}

export async function deleteRoleAction(
  roleId: string,
): Promise<RoleActionResult> {
  try {
    await requirePermission(PERMISSION_SCOPES.roles, "delete");
    const affectedUserIds = await getUserIdsByRoleId(roleId);

    if (!roleId) {
      return {
        success: false,
        message: "ID role tidak valid.",
      };
    }

    await prisma.roles.delete({
      where: {
        id: roleId,
      },
    });

    invalidateAuthUserPayloads(affectedUserIds);
    if (affectedUserIds.length > 0) {
      broadcastAuthSessionChanged({
        targetUserIds: affectedUserIds,
        reason: "ROLE_DELETED",
        message: "Role kamu berubah.",
      });
    }

    revalidatePath(ADMIN_ROLES_PATH);
    revalidatePath(ADMIN_USERS_PATH);

    return {
      success: true,
      message: "Role berhasil dihapus.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}
