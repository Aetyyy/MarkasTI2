import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";
import { broadcastNotification } from "@/libs/realtime/notifications";
import { sendPushToUsers } from "@/libs/notifications/push";

async function context() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!user) return null;
  return {
    session,
    user,
    canCreate: canAccess(session.user, PERMISSION_SCOPES.tasks, "create"),
    canUpdate: canAccess(session.user, PERMISSION_SCOPES.tasks, "update"),
    canDelete: canAccess(session.user, PERMISSION_SCOPES.tasks, "delete"),
  };
}

function taskData(task: { id: string; title: string; course: string | null; category: string | null; priority: string; status: string; dueDate: Date; reminderTime: string | null; description: string | null; assignedToId: string | null; createdById: string | null; assignedTo?: { name: string } | null; createdBy?: { name: string } | null }) {
  return { ...task, dueDate: task.dueDate.toISOString().slice(0, 10) };
}

export async function GET() {
  const ctx = await context();
  if (!ctx) return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  const [tasks, users] = await Promise.all([
    prisma.taskReminder.findMany({
      where: { assignedToId: ctx.user.id },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: { assignedTo: { select: { name: true } }, createdBy: { select: { name: true } } },
    }),
    ctx.canCreate ? prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, nim: true } }) : Promise.resolve([]),
  ]);
  return Response.json({ ok: true, data: tasks.map(taskData), users, canCreate: ctx.canCreate });
}

export async function POST(request: NextRequest) {
  const ctx = await context();
  if (!ctx) return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  if (!ctx.canCreate) return Response.json({ ok: false, message: "Kamu tidak memiliki permission untuk membuat tugas." }, { status: 403 });
  const body = await request.json();
  const title = String(body.title || "").trim();
  const dueDate = String(body.dueDate || "");
  if (!title || !dueDate) {
    return Response.json(
      { ok: false, message: "Judul dan deadline tugas wajib diisi." },
      { status: 400 },
    );
  }

  const requestedRecipient = String(body.assignedToId || ctx.user.id);
  const recipientIds =
    requestedRecipient === "ALL"
      ? (
          await prisma.user.findMany({
            select: { id: true },
          })
        ).map((user) => user.id)
      : [requestedRecipient];

  const tasks = await prisma.$transaction(
    recipientIds.map((assignedToId) =>
      prisma.taskReminder.create({
        data: {
          title,
          course: String(body.course || "").trim() || null,
          category: String(body.category || "Tugas").trim(),
          priority: body.priority || "SEDANG",
          dueDate: new Date(`${dueDate}T00:00:00.000Z`),
          reminderTime: String(body.reminderTime || "19:00"),
          description: String(body.description || "").trim() || null,
          assignedToId,
          createdById: ctx.user.id,
        },
        include: {
          assignedTo: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ),
  );

  await prisma.userNotification.createMany({
    data: tasks.map((task) => ({
      userId: task.assignedToId!,
      type: "task",
      title: "Tugas baru",
      body: task.title,
      url: "/task-reminder",
      referenceId: task.id,
    })),
  });

  broadcastNotification(
    {
      type: "task",
      title: "Tugas baru",
      body: title,
      url: "/task-reminder",
      referenceId: tasks[0]?.id,
    },
    recipientIds,
  );
  await sendPushToUsers(recipientIds, {
    type: "task",
    title: "Tugas baru",
    body: title,
    url: "/task-reminder",
    tag: `task-${tasks[0]?.id || Date.now()}`,
    referenceId: tasks[0]?.id,
  });

  return Response.json({
    ok: true,
    data: tasks.map(taskData),
    recipients: recipientIds.length,
  });
}

export async function PATCH(request: NextRequest) {
  const ctx = await context();
  if (!ctx) return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  const body = await request.json();
  const existing = await prisma.taskReminder.findUnique({ where: { id: String(body.id) } });
  if (
    !existing ||
    (existing.assignedToId !== ctx.user.id && !ctx.canUpdate)
  ) {
    return Response.json({ ok: false, message: "Tugas tidak ditemukan atau tidak dapat diubah." }, { status: 404 });
  }
  const task = await prisma.taskReminder.update({ where: { id: existing.id }, data: { status: body.status === "SELESAI" ? "SELESAI" : "BELUM" } });
  return Response.json({ ok: true, data: taskData(task) });
}

export async function DELETE(request: NextRequest) {
  const ctx = await context();
  if (!ctx) return Response.json({ ok: false, message: "Silakan login." }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id") || "";
  const task = await prisma.taskReminder.findUnique({ where: { id } });
  const canDelete = task && (task.createdById === ctx.user.id || ctx.canDelete);
  if (!canDelete) return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  await prisma.taskReminder.delete({ where: { id } });
  return Response.json({ ok: true });
}
