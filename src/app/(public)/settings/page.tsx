import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";
import SettingsClient from "./settingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/settings");
  }

  const settings = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      publicProfile: true,
      showSocials: true,
      taskReminder: true,
      emailNotification: true,
      notifyGalleryUploads: true,
      notifyAnnouncements: true,
    },
  });

  if (!settings) redirect("/login?callbackUrl=/settings");

  return <SettingsClient initialSettings={settings} />;
}
