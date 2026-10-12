import { prisma } from "@/libs/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await prisma.announcement.findMany({
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
  });
  return Response.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}
