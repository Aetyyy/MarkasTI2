import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";
import { broadcastChat } from "@/libs/realtime/chat";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { broadcastNotification } from "@/libs/realtime/notifications";
import { sendPushToUsers } from "@/libs/notifications/push";

const selectMessage = {
  id: true,
  text: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, image: true, classPosition: true } },
} as const;

function serialize<T extends { createdAt: Date; updatedAt: Date }>(message: T) {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await auth();
  const [messages, mentionUsers] = await Promise.all([
    prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: selectMessage,
    }),
    session?.user?.id
      ? prisma.user.findMany({
          where: { id: { not: session.user.id } },
          orderBy: { name: "asc" },
          select: { id: true, name: true, nim: true, image: true },
        })
      : Promise.resolve([]),
  ]);
  const canModerate = Boolean(
    session?.user &&
      canAccess(session.user, PERMISSION_SCOPES.chat, "delete"),
  );

  return Response.json({
    ok: true,
    data: messages.reverse().map(serialize),
    canModerate,
    mentionUsers,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false, message: "Login untuk mengirim chat." }, { status: 401 });
  const body = await request.json();
  const text = String(body.text || "").trim().slice(0, 1000);
  if (!text) return Response.json({ ok: false, message: "Pesan tidak boleh kosong." }, { status: 400 });
  const mentionAll = body.mentionAll === true && /(^|\s)@all(?=\s|$)/i.test(text);
  const requestedMentionIds: string[] = Array.isArray(body.mentionedUserIds)
    ? Array.from<string>(
        new Set<string>(
          body.mentionedUserIds
            .map((id: unknown) => String(id))
            .filter((id: string) => id && id !== session.user.id),
        ),
      ).slice(0, 50)
    : [];

  const mentionCandidates = await prisma.user.findMany({
    where: mentionAll
      ? { id: { not: session.user.id } }
      : { id: { in: requestedMentionIds, not: session.user.id } },
    select: { id: true, name: true },
  });
  const mentionedUsers = mentionAll
    ? mentionCandidates
    : mentionCandidates.filter((user) => text.includes(`@${user.name}`));
  const message = await prisma.chatMessage.create({ data: { text, userId: session.user.id }, select: selectMessage });
  const serialized = serialize(message);
  broadcastChat({ type: "CHAT_CREATED", message: serialized });

  const recipientIds = mentionedUsers.map((user) => user.id);
  if (recipientIds.length > 0) {
    const notificationTitle = mentionAll
      ? `${session.user.name || "Seseorang"} menandai semua orang di Global Chat`
      : `${session.user.name || "Seseorang"} menandai kamu di Global Chat`;
    const notificationBody = text.slice(0, 300);

    await prisma.userNotification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type: "chat_mention",
        title: notificationTitle,
        body: notificationBody,
        url: "/?chat=open",
        referenceId: message.id,
      })),
    });
    broadcastNotification(
      {
        type: "notification",
        title: notificationTitle,
        body: notificationBody,
        url: "/?chat=open",
        referenceId: message.id,
      },
      recipientIds,
    );
    await sendPushToUsers(recipientIds, {
      type: "notification",
      title: notificationTitle,
      body: notificationBody,
      url: "/?chat=open",
      tag: `chat-mention-${message.id}`,
      referenceId: message.id,
    });
  }
  return Response.json({
    ok: true,
    data: serialized,
    mentioned: recipientIds.length,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id || "");
  const text = String(body.text || "").trim().slice(0, 1000);
  if (!text) {
    return Response.json({ ok: false, message: "Pesan tidak boleh kosong." }, { status: 400 });
  }

  const existing = await prisma.chatMessage.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return Response.json({ ok: false, message: "Kamu hanya dapat mengedit pesan sendiri." }, { status: 403 });
  }

  const message = await prisma.chatMessage.update({
    where: { id },
    data: { text },
    select: selectMessage,
  });
  const serialized = serialize(message);
  broadcastChat({ type: "CHAT_UPDATED", message: serialized });
  return Response.json({ ok: true, data: serialized });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id") || "";
  const existing = await prisma.chatMessage.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, message: "Pesan tidak ditemukan." }, { status: 404 });
  }

  const canModerate = canAccess(
    session.user,
    PERMISSION_SCOPES.chat,
    "delete",
  );
  if (existing.userId !== session.user.id && !canModerate) {
    return Response.json({ ok: false, message: "Tidak punya akses menghapus pesan ini." }, { status: 403 });
  }

  await prisma.chatMessage.delete({ where: { id } });
  broadcastChat({ type: "CHAT_DELETED", messageId: id });
  return Response.json({ ok: true });
}
