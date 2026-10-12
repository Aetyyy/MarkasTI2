import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";

const settingsSelect = {
  publicProfile: true,
  showSocials: true,
  taskReminder: true,
  emailNotification: true,
  notifyGalleryUploads: true,
  notifyAnnouncements: true,
} as const;

async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json(
      { ok: false, message: "Silakan login terlebih dahulu." },
      { status: 401 },
    );
  }

  const settings = await prisma.user.findUnique({
    where: { id: userId },
    select: settingsSelect,
  });

  if (!settings) {
    return Response.json(
      { ok: false, message: "Akun tidak ditemukan." },
      { status: 404 },
    );
  }

  return Response.json({ ok: true, data: settings });
}

export async function PATCH(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return Response.json(
      { ok: false, message: "Silakan login terlebih dahulu." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const settings = await prisma.user.update({
    where: { id: userId },
    data: {
      publicProfile: body.publicProfile === true,
      showSocials: body.showSocials === true,
      taskReminder: body.taskReminder === true,
      emailNotification: body.emailNotification === true,
      notifyGalleryUploads: body.notifyGalleryUploads !== false,
      notifyAnnouncements: body.notifyAnnouncements !== false,
    },
    select: settingsSelect,
  });

  return Response.json({
    ok: true,
    message: "Pengaturan berhasil disimpan.",
    data: settings,
  });
}
