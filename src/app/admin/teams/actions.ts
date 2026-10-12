"use server";

import { deleteStorageImage } from "@/libs/storage";
import { prisma } from "@/libs/prisma";
import type { ClassMemberRole } from "@/types/member";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

type ActionResult = {
  ok: boolean;
  message: string;
};

export type SavedTeamMember = {
  id: string;
  classPosition: ClassMemberRole;
  sortOrder: number;
  publicProfile: boolean;
  showSocials: boolean;
  codeName: string | null;
  teamImage: string | null;
  updatedAt: string;
};

type SaveTeamMemberResult = ActionResult & {
  member?: SavedTeamMember;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function readRole(value: unknown): ClassMemberRole {
  const role = String(value ?? "ANGGOTA");

  if (
    role === "KETUA_KELAS" ||
    role === "WAKIL_KETUA_KELAS" ||
    role === "SEKRETARIS" ||
    role === "BENDAHARA_1" ||
    role === "BENDAHARA_2" ||
    role === "ANGGOTA"
  ) {
    return role;
  }

  return "ANGGOTA";
}

export async function saveTeamMemberModalAction(input: {
  id: string;
  classPosition: string;
  sortOrder: number;
  publicProfile: boolean;
  showSocials: boolean;
  codeName: string;
  teamImage: string | null;
  removeTeamImage: boolean;
}): Promise<SaveTeamMemberResult> {
  try {
    await requirePermission(PERMISSION_SCOPES.teams, "update");

    const id = cleanText(input.id);
    const classPosition = readRole(input.classPosition);
    const sortOrder = Number(input.sortOrder || 0);
    const publicProfile = Boolean(input.publicProfile);
    const showSocials = Boolean(input.showSocials);
    const codeName = cleanText(input.codeName).toUpperCase() || null;
    const removeTeamImage = Boolean(input.removeTeamImage);
    const nextTeamImage = removeTeamImage ? null : cleanText(input.teamImage);

    if (!id) {
      return {
        ok: false,
        message: "ID team tidak ditemukan.",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        teamImage: true,
      },
    });

    if (!user) {
      return {
        ok: false,
        message: "User tidak ditemukan.",
      };
    }

    const imageChanged = user.teamImage !== nextTeamImage;

    const updatedUser = await prisma.user.update({
      where: {
        id,
      },
      data: {
        classPosition,
        sortOrder,
        publicProfile,
        showSocials,
        codeName,
        teamImage: nextTeamImage || null,
      },
      select: {
        id: true,
        classPosition: true,
        sortOrder: true,
        publicProfile: true,
        showSocials: true,
        codeName: true,
        teamImage: true,
        updatedAt: true,
      },
    });

    if (imageChanged && user.teamImage) {
      await deleteStorageImage(user.teamImage);
    }

    revalidatePath("/admin/teams");
    revalidatePath("/team");
    revalidatePath("/anggota");

    return {
      ok: true,
      message: "Data team berhasil disimpan.",
      member: {
        id: updatedUser.id,
        classPosition: updatedUser.classPosition,
        sortOrder: updatedUser.sortOrder,
        publicProfile: updatedUser.publicProfile,
        showSocials: updatedUser.showSocials,
        codeName: updatedUser.codeName,
        teamImage: updatedUser.teamImage,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menyimpan data team.",
    };
  }
}
