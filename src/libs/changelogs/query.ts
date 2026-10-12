import "server-only";

import { prisma } from "@/libs/prisma";
import { requirePermission } from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";
import type { ChangelogForClient, ChangelogType } from "@/types/changelog";

type ChangelogRow = {
  id: string;
  version: string;
  title: string;
  summary: string;
  details: string | null;
  type: string;
  isPublished: boolean;
  publishedAt: Date | null;
  sortOrder: number;
  authorName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function serializeChangelog(item: ChangelogRow): ChangelogForClient {
  return {
    ...item,
    type: item.type as ChangelogType,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getPublicChangelogs(limit = 6) {
  const items = await prisma.changelog.findMany({
    where: { isPublished: true },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
      { sortOrder: "desc" },
    ],
    take: Math.min(12, Math.max(1, limit)),
  });

  return items.map(serializeChangelog);
}

export async function getAdminChangelogs() {
  await requirePermission(PERMISSION_SCOPES.changelogs, "read");

  const items = await prisma.changelog.findMany({
    orderBy: [
      { isPublished: "desc" },
      { sortOrder: "desc" },
      { publishedAt: "desc" },
      { updatedAt: "desc" },
    ],
  });

  return items.map(serializeChangelog);
}
