"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/libs/prisma";
import type { PermissionActionResult } from "@/types/permissionManagement";
import { getUserIdsByPermissionScopeId } from "@/libs/auth/affectedUsers";
import { invalidateAuthUserPayloads } from "@/libs/auth/userPayload";
import { broadcastAuthSessionChanged } from "@/libs/realtime/authRealtime";
import {
  getAuthorizationErrorMessage,
  requirePermission,
} from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

const ADMIN_PERMISSIONS_PATH = "/admin/permissions";
const ADMIN_ROLES_PATH = "/admin/roles";

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function normalizeScopeName(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "_");
}

function getErrorMessage(error: unknown) {
  const accessMessage = getAuthorizationErrorMessage(error);

  if (accessMessage) {
    return accessMessage;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Permission scope sudah terdaftar.";
    }

    if (error.code === "P2025") {
      return "Permission scope tidak ditemukan.";
    }

    if (error.code === "P2003") {
      return "Permission scope masih dipakai oleh role atau user.";
    }
  }

  return "Terjadi kesalahan pada server.";
}

export async function savePermissionScopeAction(
  formData: FormData,
  scopeId?: string,
): Promise<PermissionActionResult> {
  try {
    await requirePermission(
      PERMISSION_SCOPES.permissions,
      scopeId ? "update" : "create",
    );

    const name = normalizeScopeName(getFormString(formData, "name"));
    const description = getFormString(formData, "description");
    const affectedUserIds = scopeId
      ? await getUserIdsByPermissionScopeId(scopeId)
      : [];

    if (!name) {
      return {
        success: false,
        message: "Nama permission scope wajib diisi.",
      };
    }

    const duplicateScope = await prisma.permissionScope.findFirst({
      where: {
        name,
        ...(scopeId
          ? {
              NOT: {
                id: scopeId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (duplicateScope) {
      return {
        success: false,
        message: "Permission scope dengan nama tersebut sudah ada.",
      };
    }

    if (scopeId) {
      await prisma.permissionScope.update({
        where: {
          id: scopeId,
        },
        data: {
          name,
          description: description || null,
        },
      });

      invalidateAuthUserPayloads(affectedUserIds);
      if (affectedUserIds.length > 0) {
        broadcastAuthSessionChanged({
          targetUserIds: affectedUserIds,
          reason: "PERMISSION_UPDATED",
          message: "Permission kamu diperbarui.",
        });
      }

      revalidatePath(ADMIN_PERMISSIONS_PATH);
      revalidatePath(ADMIN_ROLES_PATH);

      return {
        success: true,
        message: "Permission scope berhasil diperbarui.",
      };
    }

    await prisma.permissionScope.create({
      data: {
        name,
        description: description || null,
      },
    });

    revalidatePath(ADMIN_PERMISSIONS_PATH);
    revalidatePath(ADMIN_ROLES_PATH);

    return {
      success: true,
      message: "Permission scope berhasil dibuat.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}

export async function deletePermissionScopeAction(
  scopeId: string,
): Promise<PermissionActionResult> {
  try {
    await requirePermission(PERMISSION_SCOPES.permissions, "delete");
    const affectedUserIds = await getUserIdsByPermissionScopeId(scopeId);

    if (!scopeId) {
      return {
        success: false,
        message: "ID permission scope tidak valid.",
      };
    }

    const usedByRole = await prisma.rolePermission.count({
      where: {
        scopeId,
      },
    });

    const usedByUser = await prisma.userPermission.count({
      where: {
        scopeId,
      },
    });

    if (usedByRole > 0 || usedByUser > 0) {
      return {
        success: false,
        message:
          "Permission scope tidak bisa dihapus karena masih dipakai oleh role atau user.",
      };
    }

    await prisma.permissionScope.delete({
      where: {
        id: scopeId,
      },
    });

    invalidateAuthUserPayloads(affectedUserIds);
    if (affectedUserIds.length > 0) {
      broadcastAuthSessionChanged({
        targetUserIds: affectedUserIds,
        reason: "PERMISSION_DELETED",
        message: "Permission kamu berubah.",
      });
    }

    revalidatePath(ADMIN_PERMISSIONS_PATH);
    revalidatePath(ADMIN_ROLES_PATH);

    return {
      success: true,
      message: "Permission scope berhasil dihapus.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}
