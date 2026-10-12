import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  const body = await request.json();
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) return Response.json({ ok: false, message: "Subscription tidak valid." }, { status: 400 });
  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    create: { endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, userId: session.user.id, userAgent: request.headers.get("user-agent") },
    update: { p256dh: body.keys.p256dh, auth: body.keys.auth, userId: session.user.id, userAgent: request.headers.get("user-agent") },
  });
  return Response.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ ok: false, subscribed: false }, { status: 401 });
  }

  const count = await prisma.pushSubscription.count({
    where: { userId: session.user.id },
  });

  return Response.json({ ok: true, subscribed: count > 0, devices: count });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false }, { status: 401 });
  const body = await request.json();
  if (body.endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId: session.user.id } });
  return Response.json({ ok: true });
}
