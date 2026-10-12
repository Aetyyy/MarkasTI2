import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";

export const dynamic = "force-dynamic";

const DAY_MAP: Record<
  string,
  "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU"
> = {
  Monday: "SENIN",
  Tuesday: "SELASA",
  Wednesday: "RABU",
  Thursday: "KAMIS",
  Friday: "JUMAT",
  Saturday: "SABTU",
};

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatRelative(date: Date) {
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function jakartaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      { ok: false, message: "Belum login." },
      { status: 401 },
    );
  }

  if (!canAccess(session.user, PERMISSION_SCOPES.dashboard, "read")) {
    return Response.json(
      { ok: false, message: "Tidak punya akses dashboard." },
      { status: 403 },
    );
  }

  const now = new Date();
  const todayKey = jakartaDateKey(now);
  const dayName = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Asia/Jakarta",
  }).format(now);
  const today = DAY_MAP[dayName];

  const startMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 4, 1),
  );
  const startWeek = new Date(now);
  const day = startWeek.getDay() || 7;
  startWeek.setDate(startWeek.getDate() - day + 1);
  startWeek.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalDosen,
    activeSchedules,
    incomeAggregate,
    expenseAggregate,
    schedules,
    latestIncome,
    latestExpense,
    latestSchedules,
    taskRows,
    attendanceRows,
    incomeRows,
    expenseRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.dosen.count(),
    prisma.jadwal.count({ where: { isActive: true } }),
    prisma.kasMasuk.aggregate({ _sum: { amount: true } }),
    prisma.kasKeluar.aggregate({ _sum: { amount: true } }),
    today
      ? prisma.jadwal.findMany({
          where: { day: today, isActive: true },
          orderBy: { startTime: "asc" },
          take: 5,
          select: {
            startTime: true,
            endTime: true,
            title: true,
            location: true,
            dosen: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    prisma.kasMasuk.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.kasKeluar.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.jadwal.findMany({ orderBy: { updatedAt: "desc" }, take: 2 }),
    prisma.taskReminder.findMany({
      where: { status: "BELUM" },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 2,
      include: {
        assignedTo: {
          select: {
            name: true,
            nim: true,
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: startWeek } },
      select: { date: true, status: true },
    }),
    prisma.kasMasuk.findMany({
      where: { date: { gte: startMonth } },
      select: { date: true, amount: true },
    }),
    prisma.kasKeluar.findMany({
      where: { date: { gte: startMonth } },
      select: { date: true, amount: true },
    }),
  ]);

  const income = Number(incomeAggregate._sum.amount ?? 0n);
  const expense = Number(expenseAggregate._sum.amount ?? 0n);

  const months = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 4 + index, 1),
    );
    return {
      key: monthKey(date),
      label: new Intl.DateTimeFormat("id-ID", {
        month: "short",
        timeZone: "UTC",
      }).format(date),
      income: 0,
      expense: 0,
    };
  });
  const monthMap = new Map(months.map((item) => [item.key, item]));
  incomeRows.forEach((item) => {
    const target = monthMap.get(monthKey(item.date));
    if (target) target.income += Number(item.amount);
  });
  expenseRows.forEach((item) => {
    const target = monthMap.get(monthKey(item.date));
    if (target) target.expense += Number(item.amount);
  });

  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum"];
  const attendance = weekdays.map((label, index) => {
    const date = new Date(startWeek);
    date.setDate(startWeek.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const rows = attendanceRows.filter(
      (item) => item.date.toISOString().slice(0, 10) === key,
    );
    const present = rows.filter(
      (item) => !["ALPHA"].includes(item.status),
    ).length;
    return {
      day: label,
      value: rows.length ? Math.round((present / rows.length) * 100) : 0,
    };
  });

  const activity = [
    ...latestIncome.map((item) => ({
      title: "Kas masuk ditambahkan",
      desc: `${item.payerName} membayar ${Number(item.amount).toLocaleString("id-ID")}`,
      time: formatRelative(item.createdAt),
      tone: "green" as const,
      kind: "income" as const,
      createdAt: item.createdAt,
    })),
    ...latestExpense.map((item) => ({
      title: "Pengeluaran kas tercatat",
      desc: item.description,
      time: formatRelative(item.createdAt),
      tone: "red" as const,
      kind: "expense" as const,
      createdAt: item.createdAt,
    })),
    ...latestSchedules.map((item) => ({
      title: "Jadwal diperbarui",
      desc: `${item.title} · ${item.location || "Lokasi belum diatur"}`,
      time: formatRelative(item.updatedAt),
      tone: "blue" as const,
      kind: "schedule" as const,
      createdAt: item.updatedAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((item) => ({
      title: item.title,
      desc: item.desc,
      time: item.time,
      tone: item.tone,
      kind: item.kind,
    }));

  return Response.json({
    ok: true,
    data: {
      summary: {
        totalUsers,
        totalDosen,
        activeSchedules,
        balance: income - expense,
      },
      schedules: schedules.map((item) => ({
        time: `${item.startTime} - ${item.endTime || "Selesai"}`,
        subject: item.title,
        dosenName: item.dosen?.name || "Dosen belum diisi",
        room: item.location || "Belum ditentukan",
        status: "Berikutnya" as const,
      })),
      activities: activity,
      tasks: taskRows.map((item) => {
        const deadline = item.dueDate.toISOString().slice(0, 10);

        return {
          title: item.title,
          course: item.course || item.category || "Tugas Mata Kuliah",
          deadline,
          priority:
            item.priority === "TINGGI"
              ? "Tinggi"
              : item.priority === "RENDAH"
                ? "Rendah"
                : "Sedang",
          audience: item.assignedTo
            ? `${item.assignedTo.name} · ${item.assignedTo.nim}`
            : "Semua mahasiswa",
          dueState:
            deadline < todayKey
              ? "Terlambat"
              : deadline === todayKey
                ? "Hari ini"
                : "Mendatang",
        };
      }),
      weeklyAttendance: attendance,
      cashChart: months.map((item) => ({
        label: item.label,
        income: item.income,
        expense: item.expense,
      })),
    },
  });
}
