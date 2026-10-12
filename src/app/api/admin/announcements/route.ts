import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";
import { broadcastToInterestedUsers } from "@/libs/notifications/broadcastToUsers";

export const dynamic = "force-dynamic";

async function authorized(action: "read" | "create" | "update" | "delete") {
  const session = await auth();
  return session?.user && canAccess(session.user, PERMISSION_SCOPES.announcements, action)
    ? session
    : null;
}

function denied() {
  return Response.json({ ok: false, message: "Tidak memiliki izin mengelola pengumuman." }, { status: 403 });
}

export async function GET() {
  if (!(await authorized("read"))) return denied();
  const data = await prisma.announcement.findMany({ orderBy: [{ updatedAt: "desc" }] });
  return Response.json({ ok: true, data });
}

export async function POST(request: Request) {
  const session = await authorized("create");
  if (!session) return denied();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = String(body?.title || "").trim();
  const text = String(body?.body || "").trim();
  const urlValue = String(body?.url || "").trim();
  const isPublished = body?.isPublished === true;
  if (!title || title.length > 180 || !text || text.length > 1000 || (urlValue && (!urlValue.startsWith("/") || urlValue.startsWith("//")))) {
    return Response.json({ ok: false, message: "Judul, isi, atau tautan pengumuman tidak valid." }, { status: 400 });
  }
  const item = await prisma.announcement.create({
    data: {
      title,
      body: text,
      url: urlValue || null,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      createdBy: session.user.name || session.user.email || null,
    },
  });
  if (isPublished) await notifyAnnouncement(item.id, item.title, item.body, item.url);
  return Response.json({ ok: true, data: item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await authorized("update");
  if (!session) return denied();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = String(body?.id || "");
  const title = String(body?.title || "").trim();
  const text = String(body?.body || "").trim();
  const urlValue = String(body?.url || "").trim();
  const isPublished = body?.isPublished === true;
  if (!id || !title || title.length > 180 || !text || text.length > 1000 || (urlValue && (!urlValue.startsWith("/") || urlValue.startsWith("//")))) {
    return Response.json({ ok: false, message: "Data pengumuman tidak valid." }, { status: 400 });
  }
  const previous = await prisma.announcement.findUnique({ where: { id } });
  if (!previous) return Response.json({ ok: false, message: "Pengumuman tidak ditemukan." }, { status: 404 });
  const item = await prisma.announcement.update({
    where: { id },
    data: {
      title,
      body: text,
      url: urlValue || null,
      isPublished,
      publishedAt: isPublished ? previous.publishedAt || new Date() : null,
    },
  });
  if (isPublished && (!previous.isPublished || previous.title !== title || previous.body !== text)) {
    await notifyAnnouncement(item.id, item.title, item.body, item.url);
  }
  return Response.json({ ok: true, data: item });
}

export async function DELETE(request: Request) {
  if (!(await authorized("delete"))) return denied();
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return Response.json({ ok: false, message: "ID pengumuman wajib diisi." }, { status: 400 });
  await prisma.announcement.delete({ where: { id: body.id } }).catch(() => null);
  return Response.json({ ok: true });
}

async function notifyAnnouncement(id: string, title: string, body: string, url: string | null) {
  await broadcastToInterestedUsers("notifyAnnouncements", {
    type: "announcement",
    title: `Pengumuman: ${title}`,
    body,
    url: url || "/announcements",
    tag: `announcement-${id}`,
    referenceId: id,
  });
}
