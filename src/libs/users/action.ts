"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hash } from "bcrypt-ts";
import { prisma } from "@/libs/prisma";
import { invalidateAuthUserPayload } from "@/libs/auth/userPayload";
import {
  broadcastAuthForceLogout,
  broadcastAuthSessionChanged,
} from "@/libs/realtime/authRealtime";
import {
  getAuthorizationErrorMessage,
  requirePermission,
} from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

const ADMIN_USERS_PATH = "/admin/users";
const ADMIN_ROLES_PATH = "/admin/roles";

export type UserActionResult = {
  success: boolean;
  message: string;
};

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function uniqueArray(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function getRoleIdsFromForm(formData: FormData) {
  const roleIdsFromRoleIds = formData
    .getAll("roleIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const roleIdsFromRoles = formData
    .getAll("roles")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const roleId = getFormString(formData, "roleId");

  const roleIdsJson = getFormString(formData, "roleIdsJson");
  let roleIdsFromJson: string[] = [];

  if (roleIdsJson) {
    try {
      const parsed = JSON.parse(roleIdsJson);

      if (Array.isArray(parsed)) {
        roleIdsFromJson = parsed
          .map((value) => String(value).trim())
          .filter(Boolean);
      }
    } catch {
      roleIdsFromJson = [];
    }
  }

  return uniqueArray([
    ...roleIdsFromRoleIds,
    ...roleIdsFromRoles,
    roleId,
    ...roleIdsFromJson,
  ]);
}

function getErrorMessage(error: unknown) {
  const accessMessage = getAuthorizationErrorMessage(error);

  if (accessMessage) {
    return accessMessage;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "NIM atau email sudah terdaftar.";
    }

    if (error.code === "P2025") {
      return "Data user atau role tidak ditemukan.";
    }

    if (error.code === "P2003") {
      return "Data tidak valid atau masih terhubung dengan data lain.";
    }
  }

  return "Terjadi kesalahan pada server.";
}

export async function saveUserAction(
  formData: FormData,
  userId?: string,
): Promise<UserActionResult> {
  try {
    await requirePermission(
      PERMISSION_SCOPES.users,
      userId ? "update" : "create",
    );

    const name = getFormString(formData, "name");
    const nim = getFormString(formData, "nim");
    const email = getFormString(formData, "email");
    const password = getFormString(formData, "password");
    const image = getFormString(formData, "image");
    const roleIds = getRoleIdsFromForm(formData);

    if (!name || !nim || !email) {
      return {
        success: false,
        message: "Nama, NIM, dan email wajib diisi.",
      };
    }

    if (!userId && !password) {
      return {
        success: false,
        message: "Password wajib diisi saat membuat user baru.",
      };
    }

    const duplicateUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            nim,
          },
          {
            email,
          },
        ],
        ...(userId
          ? {
              NOT: {
                id: userId,
              },
            }
          : {}),
      },
      select: {
        id: true,
        nim: true,
        email: true,
      },
    });

    if (duplicateUser) {
      if (duplicateUser.nim === nim) {
        return {
          success: false,
          message: "NIM sudah terdaftar.",
        };
      }

      if (duplicateUser.email === email) {
        return {
          success: false,
          message: "Email sudah terdaftar.",
        };
      }

      return {
        success: false,
        message: "NIM atau email sudah terdaftar.",
      };
    }

    if (roleIds.length > 0) {
      const totalRoles = await prisma.roles.count({
        where: {
          id: {
            in: roleIds,
          },
        },
      });

      if (totalRoles !== roleIds.length) {
        return {
          success: false,
          message: "Ada role yang tidak ditemukan.",
        };
      }
    }

    if (userId) {
      const existingUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
        },
      });

      if (!existingUser) {
        return {
          success: false,
          message: "User tidak ditemukan.",
        };
      }

      const updateData: Prisma.UserUpdateInput = {
        name,
        nim,
        email,
        image: image || null,
        roles: {
          set: roleIds.map((roleId) => ({
            id: roleId,
          })),
        },
      };

      if (password) {
        updateData.password = await hash(password, 10);
      }

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: updateData,
      });

      invalidateAuthUserPayload(userId);
      broadcastAuthSessionChanged({
        targetUserIds: [userId],
        reason: "USER_UPDATED",
        message: "Data akun kamu diperbarui.",
      });

      revalidatePath(ADMIN_USERS_PATH);
      revalidatePath(ADMIN_ROLES_PATH);

      return {
        success: true,
        message: "User berhasil diperbarui.",
      };
    }

    const hashedPassword = await hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        nim,
        email,
        password: hashedPassword,
        image: image || null,
        roles: {
          connect: roleIds.map((roleId) => ({
            id: roleId,
          })),
        },
      },
    });

    revalidatePath(ADMIN_USERS_PATH);
    revalidatePath(ADMIN_ROLES_PATH);

    return {
      success: true,
      message: "User berhasil dibuat.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}

export async function updateUserAction(
  userId: string,
  formData: FormData,
): Promise<UserActionResult> {
  return saveUserAction(formData, userId);
}

export async function deleteUserAction(
  userId: string,
): Promise<UserActionResult> {
  try {
    await requirePermission(PERMISSION_SCOPES.users, "delete");

    if (!userId) {
      return {
        success: false,
        message: "ID user tidak valid.",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      return {
        success: false,
        message: "User tidak ditemukan.",
      };
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    invalidateAuthUserPayload(userId);
    broadcastAuthForceLogout({
      targetUserIds: [userId],
      reason: "USER_DELETED",
      message: "Akun kamu sudah dihapus.",
    });

    revalidatePath(ADMIN_USERS_PATH);
    revalidatePath(ADMIN_ROLES_PATH);

    return {
      success: true,
      message: "User berhasil dihapus.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}
