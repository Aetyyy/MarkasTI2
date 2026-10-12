import { auth } from "@/auth";
import {
  canAccess,
  PERMISSION_SCOPES,
} from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";

export const dynamic = "force-dynamic";

type ActivityKind =
  | "USER"
  | "CASH"
  | "SCHEDULE"
  | "GALLERY"
  | "ATTENDANCE"
  | "TASK"
  | "SECURITY"
  | "TEAM";

type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  action: string;
  title: string;
  description: string;
  actor: string;
  occurredAt: string;
};

type ActivityAccessUser = {
  roles?: string[];
  permissions?: Array<{
    name: string;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }>;
};

function mayReadActivity(user: ActivityAccessUser) {
  return canAccess(user, PERMISSION_SCOPES.activityLog, "read");
}

function actionFromDates(createdAt: Date, updatedAt: Date) {
  return Math.abs(updatedAt.getTime() - createdAt.getTime()) < 1500
    ? "CREATED"
    : "UPDATED";
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ ok: false, message: "Belum login." }, { status: 401 });
  }

  if (!mayReadActivity(session.user)) {
    return Response.json(
      { ok: false, message: "Tidak punya izin melihat activity log." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  const kind = (url.searchParams.get("kind") || "ALL").toUpperCase();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(10, Number(url.searchParams.get("limit") || 20)));
  const take = 200;

  const [
    users,
    income,
    expense,
    schedules,
    gallery,
    attendance,
    tasks,
    roles,
    presets,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { updatedAt: "desc" }, take }),
    prisma.kasMasuk.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      include: { paidBy: { select: { name: true } } },
    }),
    prisma.kasKeluar.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      include: { approvedBy: { select: { name: true } } },
    }),
    prisma.jadwal.findMany({ orderBy: { updatedAt: "desc" }, take }),
    prisma.galleryPost.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      include: { uploadedBy: { select: { name: true } } },
    }),
    prisma.attendance.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      include: {
        student: { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
    }),
    prisma.taskReminder.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.roles.findMany({ orderBy: { updatedAt: "desc" }, take }),
    prisma.teamIdentityPreset.findMany({ orderBy: { updatedAt: "desc" }, take }),
  ]);

  const entries: ActivityEntry[] = [
    ...users.map((item) => ({
      id: `USER:${item.id}`,
      kind: "USER" as const,
      action: actionFromDates(item.createdAt, item.updatedAt),
      title: `Data user ${item.name}`,
      description: `${item.nim} · ${item.email}`,
      actor: item.name,
      occurredAt: item.updatedAt.toISOString(),
    })),
    ...income.map((item) => ({
      id: `INCOME:${item.id}`,
      kind: "CASH" as const,
      action: actionFromDates(item.createdAt, item.updatedAt),
      title: "Kas masuk",
      description: `${item.payerName} · Rp ${Number(item.amount).toLocaleString("id-ID")}`,
      actor: item.paidBy?.name || item.payerName,
      occurredAt: item.updatedAt.toISOString(),
    })),
    ...expense.map((item) => ({
      id: `EXPENSE:${item.id}`,
      kind: "CASH" as const,
      action: actionFromDates(item.createdAt, item.updatedAt),
      title: "Kas keluar",
      description: `${item.description} · Rp ${Number(item.amount).toLocaleString("id-ID")}`,
      actor: item.approvedBy?.name || "Sistem",
      occurredAt: item.updatedAt.toISOString(),
    })),
    ...schedules.map((item) => ({
      id: `SCHEDULE:${item.id}`,
      kind: "SCHEDULE" as const,
      action: actionFromDates(item.createdAt, item.updatedAt),
      title: item.title,
      description: `${item.day} · ${item.startTime} · ${item.location || "Tanpa lokasi"}`,
      actor: "Admin Jadwal",
      occurredAt: item.updatedAt.toISOString(),
    })),
    ...gallery.map((item) => ({
      id: `GALLERY:${item.id}`,
      kind: "GALLERY" as const,
      action: actionFromDates(item.createdAt, item.updatedAt),
      title: item.title,
      description: `Gallery · ${item.category}`,
      actor: item.uploadedBy.name,
      occurredAt: item.updatedAt.toISOString(),
    })),
    ...attendance.map((item) => ({
      id: `ATTENDANCE:${item.id}`,
      kind: "ATTENDANCE" as const,
      action: actionFromDates(item.createdAt, item.updatedAt),
      title: `Kehadiran ${item.student.name}`,
      description: `${item.status} · ${item.date.toISOString().slice(0, 10)}`,
      actor: item.recordedBy?.name || "Sistem",
      occurredAt: item.updatedAt.toISOString(),
    })),
    ...tasks.map((item) => ({
      id: `TASK:${item.id}`,
      kind: "TASK" as const,
      action: actionFromDates(item.createdAt, item.updatedAt),
      title: item.title,
      description: `${item.status} · deadline ${item.dueDate.toISOString().slice(0, 10)}`,
      actor: item.createdBy?.name || "Sistem",
      occurredAt: item.updatedAt.toISOString(),
    })),
    ...roles.map((item) => ({
      id: `ROLE:${item.id}`,
      kind: "SECURITY" as const,
      action: actionFromDates(item.createdAt, item.updatedAt),
      title: `Role ${item.name}`,
      description: "Konfigurasi role dan akses",
      actor: "Administrator",
      occurredAt: item.updatedAt.toISOString(),
    })),
    ...presets.map((item) => ({
      id: `PRESET:${item.id}`,
      kind: "TEAM" as const,
      action: actionFromDates(item.createdAt, item.updatedAt),
      title: `Preset ${item.code}`,
      description: item.name,
      actor: "Admin Team",
      occurredAt: item.updatedAt.toISOString(),
    })),
  ];

  const filtered = entries
    .filter((entry) => kind === "ALL" || entry.kind === kind)
    .filter((entry) => {
      if (!query) return true;
      return [entry.title, entry.description, entry.actor, entry.action]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return Response.json({
    ok: true,
    data: filtered.slice(start, start + limit),
    pagination: { page: safePage, limit, total, totalPages },
  });
}
