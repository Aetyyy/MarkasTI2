import { requirePagePermission } from "@/libs/auth/authorization";
import { getCrudAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";
import AnnouncementManager from "./announcementManager";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const user = await requirePagePermission(PERMISSION_SCOPES.announcements, "read");
  const items = await prisma.announcement.findMany({ orderBy: [{ updatedAt: "desc" }] });
  return <AnnouncementManager initialItems={items.map((item) => ({ ...item, publishedAt: item.publishedAt?.toISOString() || null, createdAt: item.createdAt.toISOString() }))} access={getCrudAccess(user, PERMISSION_SCOPES.announcements)} />;
}
