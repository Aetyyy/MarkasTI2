import { prisma } from "@/libs/prisma";
import { cacheDatabaseRead } from "@/libs/serverCache";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await cacheDatabaseRead("published-announcements-api", () => prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 30,
    select: {
      id: true,
      title: true,
      body: true,
      url: true,
      publishedAt: true,
    },
  }), 30);
  return Response.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}
