"use server";

import { auth } from "@/auth";
import { sendVerificationEmail } from "@/libs/mail";
import { prisma } from "@/libs/prisma";
import { invalidateAuthUserPayload } from "@/libs/auth/userPayload";
import { normalizeStoredImage } from "@/libs/imageValue";
import { deleteStorageImage } from "@/libs/storage";
import { isVercelBlobUrl } from "@/libs/vercelBlob";
import { broadcastChat } from "@/libs/realtime/chat";
import { compare, hash } from "bcrypt-ts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProfileSkillInput = {
  id?: string;
  name: string;
};

export type ProfileOrganizationInput = {
  id?: string;
  name: string;
  rank: string;
};

export type EditableProfilePayload = {
  id: string;
  nim: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  bio: string;
  quote: string;

  instagram: string;
  facebook: string;
  discord: string;
  tiktok: string;
  github: string;
  website: string;

  publicProfile: boolean;
  showSocials: boolean;
  taskReminder: boolean;

  skills: ProfileSkillInput[];
  organizations: ProfileOrganizationInput[];
};

export type SaveProfileInput = EditableProfilePayload & {
  verificationCode?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

const profileInclude = {
  skills: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  organizations: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }

  const sessionUser = session.user as {
    id?: string | null;
    email?: string | null;
  };

  let user = null;

  if (sessionUser.id) {
    user = await prisma.user.findUnique({
      where: {
        id: sessionUser.id,
      },
      include: profileInclude,
    });
  }

  if (!user && sessionUser.email) {
    user = await prisma.user.findUnique({
      where: {
        email: sessionUser.email,
      },
      include: profileInclude,
    });
  }

  if (!user) {
    redirect("/login?callbackUrl=/profile");
  }

  return user;
}

function toEditableProfile(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return {
    id: user.id,
    nim: user.nim,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    image: user.image ?? "",
    bio: user.bio ?? "",
    quote: user.quote ?? "",

    instagram: user.instagram ?? "",
    facebook: user.facebook ?? "",
    discord: user.discord ?? "",
    tiktok: user.tiktok ?? "",
    github: user.github ?? "",
    website: user.website ?? "",

    publicProfile: Boolean(user.publicProfile),
    showSocials: Boolean(user.showSocials),
    taskReminder: Boolean(user.taskReminder),

    skills: user.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
    })),

    organizations: user.organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      rank: organization.rank,
    })),
  };
}

async function validateVerificationCode({
  code,
  hashedCode,
  expires,
}: {
  code?: string;
  hashedCode: string | null;
  expires: Date | null;
}) {
  const cleanCode = cleanText(code);

  if (!cleanCode) {
    return {
      ok: false,
      message: "Kode verifikasi wajib diisi.",
    };
  }

  if (!hashedCode || !expires) {
    return {
      ok: false,
      message: "Kirim kode verifikasi terlebih dahulu.",
    };
  }

  if (expires.getTime() < Date.now()) {
    return {
      ok: false,
      message: "Kode verifikasi sudah kedaluwarsa.",
    };
  }

  const isValid = await compare(cleanCode, hashedCode);

  if (!isValid) {
    return {
      ok: false,
      message: "Kode verifikasi salah.",
    };
  }

  return {
    ok: true,
    message: "Kode valid.",
  };
}

export async function getMyProfileForEdit() {
  const user = await getCurrentUser();

  return toEditableProfile(user);
}

export async function sendProfileVerificationCodeAction(
  targetEmail: string,
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const email = cleanEmail(targetEmail || user.email);

    if (!email) {
      return {
        ok: false,
        message: "Email tidak boleh kosong.",
      };
    }

    const emailUsed = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (emailUsed) {
      return {
        ok: false,
        message: "Email sudah digunakan oleh user lain.",
      };
    }

    const code = generateCode();
    const hashedCode = await hash(code, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await sendVerificationEmail({
      to: email,
      code,
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerifyCode: hashedCode,
        emailVerifyExpires: expires,
      },
    });

    return {
      ok: true,
      message: `Kode verifikasi sudah dikirim ke ${email}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengirim kode verifikasi.",
    };
  }
}

export async function saveMyProfileAction(
  input: SaveProfileInput,
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    const nextName = cleanText(input.name);
    const nextEmail = cleanEmail(input.email);
    const nextImage = normalizeStoredImage(input.image);
    const currentEmail = user.email.toLowerCase();

    const currentPassword = cleanText(input.currentPassword);
    const newPassword = cleanText(input.newPassword);
    const confirmPassword = cleanText(input.confirmPassword);

    const emailChanged = nextEmail !== currentEmail;
    const imageChanged = nextImage !== user.image;

    if (imageChanged && nextImage && !isVercelBlobUrl(nextImage, "profile")) {
      return {
        ok: false,
        message: "Foto profile harus diupload melalui Vercel Blob.",
      };
    }

    const wantsPasswordChange =
      Boolean(currentPassword) ||
      Boolean(newPassword) ||
      Boolean(confirmPassword);

    if (!nextName) {
      return {
        ok: false,
        message: "Nama lengkap wajib diisi.",
      };
    }

    if (!nextEmail) {
      return {
        ok: false,
        message: "Email wajib diisi.",
      };
    }

    if (emailChanged) {
      const emailUsed = await prisma.user.findFirst({
        where: {
          email: nextEmail,
          NOT: {
            id: user.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (emailUsed) {
        return {
          ok: false,
          message: "Email sudah digunakan oleh user lain.",
        };
      }
    }

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return {
          ok: false,
          message:
            "Kalau ingin mengganti password, password lama, password baru, dan konfirmasi wajib diisi.",
        };
      }

      if (newPassword.length < 8) {
        return {
          ok: false,
          message: "Password baru minimal 8 karakter.",
        };
      }

      if (newPassword !== confirmPassword) {
        return {
          ok: false,
          message: "Konfirmasi password tidak sama.",
        };
      }

      const isPasswordValid = await compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return {
          ok: false,
          message: "Password lama salah.",
        };
      }
    }

    if (emailChanged || wantsPasswordChange) {
      const verification = await validateVerificationCode({
        code: input.verificationCode,
        hashedCode: user.emailVerifyCode,
        expires: user.emailVerifyExpires,
      });

      if (!verification.ok) {
        return verification;
      }
    }

    const skills = input.skills
      .map((skill) => ({
        name: cleanText(skill.name),
      }))
      .filter((skill) => skill.name);

    const uniqueSkills = Array.from(
      new Map(
        skills.map((skill) => [skill.name.toLowerCase(), skill]),
      ).values(),
    );

    const organizations = input.organizations
      .map((organization) => ({
        name: cleanText(organization.name),
        rank: cleanText(organization.rank),
      }))
      .filter((organization) => organization.name && organization.rank);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: nextName,
        email: nextEmail,
        phone: cleanText(input.phone),
        image: nextImage,
        bio: cleanText(input.bio),
        quote: cleanText(input.quote),

        instagram: cleanText(input.instagram),
        facebook: cleanText(input.facebook),
        discord: cleanText(input.discord),
        tiktok: cleanText(input.tiktok),
        github: cleanText(input.github),
        website: cleanText(input.website),

        emailVerifyCode:
          emailChanged || wantsPasswordChange ? null : user.emailVerifyCode,
        emailVerifyExpires:
          emailChanged || wantsPasswordChange ? null : user.emailVerifyExpires,

        skills: {
          deleteMany: {},
          create: uniqueSkills,
        },

        organizations: {
          deleteMany: {},
          create: organizations,
        },

        ...(wantsPasswordChange
          ? {
              password: await hash(newPassword, 12),
            }
          : {}),
      },
    });

    invalidateAuthUserPayload(user.id);

    if (imageChanged) {
      if (user.image) {
        try {
          await deleteStorageImage(user.image);
        } catch (error) {
          console.error("Failed to delete previous profile image from Blob:", error);
        }
      }
      broadcastChat({ type: "PROFILE_UPDATED", userId: user.id, image: nextImage });
    }

    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath(`/profile/${user.nim}`);

    return {
      ok: true,
      message: "Profile berhasil disimpan.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menyimpan profile.",
    };
  }
}
