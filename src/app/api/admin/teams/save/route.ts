import { auth } from "@/auth";
import { deleteStorageImage } from "@/libs/storage";
import { isVercelBlobUrl } from "@/libs/vercelBlob";
import { prisma } from "@/libs/prisma";
import type { ClassMemberRole } from "@/types/member";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function readBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
}

function readRole(value: FormDataEntryValue | null): ClassMemberRole {
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

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return Response.json(
        {
          ok: false,
          message: "Belum login.",
        },
        {
          status: 401,
        },
      );
    }

    if (!canAccess(session.user, PERMISSION_SCOPES.teams, "update")) {
      return Response.json(
        { ok: false, message: "Kamu tidak punya izin mengubah data team." },
        { status: 403 },
      );
    }

    const formData = await request.formData();

    const id = String(formData.get("id") ?? "").trim();
    const classPosition = readRole(formData.get("classPosition"));
    const sortOrder = Number(formData.get("sortOrder") ?? 0);
    const publicProfile = readBoolean(formData.get("publicProfile"));
    const showSocials = readBoolean(formData.get("showSocials"));
    const codeName = cleanText(formData.get("codeName")).toUpperCase() || null;
    const removeTeamImage = readBoolean(formData.get("removeTeamImage"));
    const imageFile = formData.get("teamImage");
    const uploadedImageUrl = cleanText(formData.get("teamImageUrl"));

    if (!id) {
      return Response.json(
        {
          ok: false,
          message: "ID team tidak ditemukan.",
        },
        {
          status: 400,
        },
      );
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
      return Response.json(
        {
          ok: false,
          message: "User tidak ditemukan.",
        },
        {
          status: 404,
        },
      );
    }

    let nextTeamImage = uploadedImageUrl || user.teamImage;
    let oldImageToDelete: string | null = null;

    if (imageFile instanceof File && imageFile.size > 0) {
      return Response.json(
        {
          ok: false,
          message: "Upload foto harus melalui layanan Vercel Blob.",
        },
        { status: 400 },
      );
    }

    if (removeTeamImage) {
      nextTeamImage = null;
      oldImageToDelete = user.teamImage;
    }

    if (uploadedImageUrl && uploadedImageUrl !== user.teamImage) {
      if (!isVercelBlobUrl(uploadedImageUrl, "team")) {
        return Response.json(
          { ok: false, message: "URL foto team tidak valid." },
          { status: 400 },
        );
      }
      nextTeamImage = uploadedImageUrl;
      oldImageToDelete = user.teamImage;
    }

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
        teamImage: nextTeamImage,
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

    if (oldImageToDelete && oldImageToDelete !== nextTeamImage) {
      const [presetUses, otherUserUses] = await Promise.all([
        prisma.teamIdentityPreset.count({
          where: { logoUrl: oldImageToDelete },
        }),
        prisma.user.count({
          where: {
            id: { not: id },
            teamImage: oldImageToDelete,
          },
        }),
      ]);

      if (presetUses === 0 && otherUserUses === 0) {
        await deleteStorageImage(oldImageToDelete);
      }
    }

    return Response.json({
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
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Gagal menyimpan data team.",
      },
      {
        status: 500,
      },
    );
  }
}
