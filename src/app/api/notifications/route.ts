import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  }

  const [items, unreadCount] = await Promise.all([
    prisma.userNotification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        url: true,
        referenceId: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.userNotification.count({
      where: { userId: session.user.id, readAt: null },
    }),
  ]);

  return Response.json({ ok: true, data: items, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; all?: boolean };
  const now = new Date();

  if (body.all) {
    await prisma.userNotification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: now },
    });
  } else if (body.id) {
    await prisma.userNotification.updateMany({
      where: { id: body.id, userId: session.user.id },
      data: { readAt: now },
    });
  } else {
    return Response.json(
      { ok: false, message: "ID notifikasi tidak valid." },
      { status: 400 },
    );
  }

  return Response.json({ ok: true, readAt: now.toISOString() });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; all?: boolean };
  if (body.all) {
    const result = await prisma.userNotification.deleteMany({
      where: { userId: session.user.id },
    });
    return Response.json({ ok: true, deleted: result.count });
  }

  if (!body.id) {
    return Response.json(
      { ok: false, message: "ID notifikasi tidak valid." },
      { status: 400 },
    );
  }

  const result = await prisma.userNotification.deleteMany({
    where: { id: body.id, userId: session.user.id },
  });
  if (result.count === 0) {
    return Response.json(
      { ok: false, message: "Notifikasi tidak ditemukan." },
      { status: 404 },
    );
  }

  return Response.json({ ok: true, deleted: result.count });
}
