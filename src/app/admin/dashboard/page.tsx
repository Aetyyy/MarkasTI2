"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JetBrains_Mono, Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowDownRight,
  FiArrowUpRight,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiCpu,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiLayers,
  FiPieChart,
  FiRefreshCcw,
  FiShield,
  FiTarget,
  FiUsers,
  FiZap,
} from "react-icons/fi";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type SummaryCard = {
  title: string;
  value: string;
  desc: string;
  trend: string;
  trendType: "up" | "down" | "neutral";
  Icon: IconType;
};

type ScheduleItem = {
  time: string;
  subject: string;
  dosenName: string;
  room: string;
  status: "Berlangsung" | "Berikutnya" | "Selesai";
};

type ActivityItem = {
  title: string;
  desc: string;
  time: string;
  Icon: IconType;
  tone: "blue" | "green" | "amber" | "red";
};

type TaskItem = {
  title: string;
  course: string;
  deadline: string;
  priority: "Tinggi" | "Sedang" | "Rendah";
  audience: string;
  dueState: "Terlambat" | "Hari ini" | "Mendatang";
};

type DashboardPayload = {
  summary: {
    totalUsers: number;
    totalDosen: number;
    activeSchedules: number;
    balance: number;
  };
  schedules: ScheduleItem[];
  activities: Array<Omit<ActivityItem, "Icon"> & {
    kind: "income" | "expense" | "schedule";
  }>;
  tasks: TaskItem[];
  weeklyAttendance: Array<{ day: string; value: number }>;
  cashChart: Array<{ label: string; income: number; expense: number }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 10) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";

  return "Selamat malam";
}

function getToneClass(tone: ActivityItem["tone"]) {
  const tones = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  return tones[tone];
}

function getStatusClass(status: ScheduleItem["status"]) {
  if (status === "Berlangsung") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  }

  if (status === "Berikutnya") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  }

  return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
}

function getPriorityClass(priority: TaskItem["priority"]) {
  if (priority === "Tinggi") {
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  }

  if (priority === "Sedang") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  }

  return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300";
}

function getDueStateClass(dueState: TaskItem["dueState"]) {
  if (dueState === "Terlambat") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
  }

  if (dueState === "Hari ini") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  }

  return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
}

function StatCard({ item, delay }: { item: SummaryCard; delay: number }) {
  const Icon = item.Icon;
  const TrendIcon =
    item.trendType === "down"
      ? FiArrowDownRight
      : item.trendType === "up"
        ? FiArrowUpRight
        : FiActivity;

  return (
    <div
      className="group relative overflow-hidden rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 dark:hover:border-blue-500/50 dark:hover:bg-white/8 dark:hover:shadow-blue-500/10"
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-300/20 blur-3xl transition-all duration-300 group-hover:bg-blue-500/20 dark:bg-blue-500/10 dark:group-hover:bg-blue-400/15" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.title}</p>
          <h3 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {item.value}
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{item.desc}</p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <TrendIcon className="h-4 w-4" />
            {item.trend}
          </div>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 group-hover:rotate-6 group-hover:scale-105 dark:bg-blue-500 dark:shadow-blue-500/20">
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  desc,
  Icon,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  Icon: IconType;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <Icon className="h-4 w-4" />
          {eyebrow}
        </span>

        <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{title}</h2>

        {desc && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [greeting, setGreeting] = useState("Selamat datang");
  const [loadingDashboard, setLoadingDashboard] = useState(true);


  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setGreeting(getGreeting());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/admin/dashboard", {
          cache: "no-store",
        });
        const result = (await response.json()) as {
          ok: boolean;
          data?: DashboardPayload;
        };

        if (active && response.ok && result.ok && result.data) {
          setDashboard(result.data);
        }
      } finally {
        if (active) setLoadingDashboard(false);
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const summaryCards = useMemo<SummaryCard[]>(() => {
    if (!dashboard) return [];

    return [
      {
        title: "Total Mahasiswa",
        value: String(dashboard.summary.totalUsers),
        desc: "User terdaftar",
        trend: "data realtime",
        trendType: "neutral",
        Icon: FiUsers,
      },
      {
        title: "Dosen",
        value: String(dashboard.summary.totalDosen),
        desc: "Dosen pengampu",
        trend: "data realtime",
        trendType: "neutral",
        Icon: FiBookOpen,
      },
      {
        title: "Jadwal Aktif",
        value: String(dashboard.summary.activeSchedules),
        desc: "Jadwal aktif",
        trend: "data realtime",
        trendType: "neutral",
        Icon: FiCalendar,
      },
      {
        title: "Kas Kelas",
        value: formatCurrency(dashboard.summary.balance),
        desc: "Saldo kas berjalan",
        trend: "data realtime",
        trendType: dashboard.summary.balance >= 0 ? "up" : "down",
        Icon: FiCreditCard,
      },
    ];
  }, [dashboard]);

  const todaySchedules = dashboard?.schedules ?? [];
  const tasks = dashboard?.tasks ?? [];
  const weeklyAttendance = dashboard?.weeklyAttendance ?? [];
  const kasChart = dashboard?.cashChart ?? [];
  const activities: ActivityItem[] = (dashboard?.activities ?? []).map(
    (item) => ({
      ...item,
      Icon:
        item.kind === "income"
          ? FiDollarSign
          : item.kind === "expense"
            ? FiArrowDownRight
            : FiCalendar,
    }),
  );

  const totalIncome = kasChart.reduce(
    (total, item) => total + item.income,
    0,
  );

  const totalExpense = kasChart.reduce(
    (total, item) => total + item.expense,
    0,
  );

  const balance = totalIncome - totalExpense;
  const maxKas = Math.max(1, ...kasChart.map((item) => item.income));
  const averageAttendance = weeklyAttendance.length
    ? Math.round(
        weeklyAttendance.reduce((total, item) => total + item.value, 0) /
          weeklyAttendance.length,
      )
    : 0;

  return (
    <div
      className={`${jakarta.className} relative min-h-full w-full overflow-hidden text-[var(--app-text)]`}
    >
      <div className="pointer-events-none fixed left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-500/10" />
      <div className="pointer-events-none fixed right-0 top-72 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/8" />
      <div className="pointer-events-none fixed bottom-0 left-20 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-500/8" />

      <section className="relative mx-auto w-full max-w-400 space-y-8 px-4 py-5 md:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-4xl border border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-blue-900/8 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30 md:p-8"
          data-aos="fade-down"
        >
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/70 via-white/30 to-blue-100/40 dark:from-white/5 dark:via-white/2 dark:to-blue-500/5" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-500/10" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/8" />

          <div className="relative z-10 grid gap-8 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                <FiShield className="h-4 w-4" />
                Markas TI · Admin Control Center
              </span>

              <h1
                className={`${orbitron.className} mt-5 text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl`}
              >
                {greeting}, Admin
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400 md:text-base">
                Pantau data kelas, jadwal, kehadiran, kas, aktivitas terbaru,
                dan tugas mata kuliah dalam satu dashboard yang rapi, cepat,
                dan mudah dibaca.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  <FiCpu className="h-4 w-4" />
                  System Online
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <FiCheckCircle className="h-4 w-4" />
                  Data Synced
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                  <FiZap className="h-4 w-4" />
                  Fast Access
                </div>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-[1.7rem] bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500 p-6 text-white shadow-2xl shadow-blue-700/25 dark:shadow-blue-500/20"
              data-aos="zoom-in-left"
              data-aos-delay="200"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                    <FiDatabase className="h-7 w-7" />
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">
                    LIVE
                  </span>
                </div>

                <p
                  className={`${jetbrains.className} mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100`}
                >
                  admin_dashboard.ts
                </p>

                <h2
                  className={`${orbitron.className} mt-2 text-4xl font-black`}
                >
                  {averageAttendance}%
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-50">
                  Rata-rata kehadiran kelas minggu ini.
                </p>

                <div className="mt-5 rounded-3xl bg-white/15 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-50">
                    <span>Class Performance</span>
                    <span>{averageAttendance}%</span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-700"
                      style={{ width: `${averageAttendance}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loadingDashboard &&
            Array.from({ length: 4 }, (_, index) => (
              <div
                key={`dashboard-skeleton-${index}`}
                className="h-44 animate-pulse rounded-4xl border border-slate-200/70 bg-white/60 backdrop-blur-2xl dark:border-white/8 dark:bg-white/5"
              />
            ))}
          {summaryCards.map((item, index) => (
            <StatCard key={item.title} item={item} delay={100 + index * 80} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div
            className="rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 md:p-6"
            data-aos="fade-right"
          >
            <SectionTitle
              eyebrow="Cash Flow"
              title="Grafik Kas Kelas"
              desc="Perbandingan pemasukan dan pengeluaran per bulan."
              Icon={FiPieChart}
            />

            <div className="mt-8 space-y-5">
              {kasChart.map((item) => {
                const incomeWidth = Math.round((item.income / maxKas) * 100);
                const expenseWidth = Math.round((item.expense / maxKas) * 100);

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p
                        className={`${jetbrains.className} text-xs font-black text-slate-500 dark:text-slate-400`}
                      >
                        {item.label}
                      </p>

                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {formatCurrency(item.income - item.expense)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="h-3 overflow-hidden rounded-full bg-blue-50 dark:bg-blue-500/15">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-blue-600 to-cyan-400"
                          style={{ width: `${incomeWidth}%` }}
                        />
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-red-50 dark:bg-red-500/15">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-red-500 to-orange-400"
                          style={{ width: `${expenseWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl bg-blue-50 p-4 dark:bg-blue-500/15">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Pemasukan</p>
                <p className="mt-1 text-sm font-black text-blue-700 dark:text-blue-300">
                  {formatCurrency(totalIncome)}
                </p>
              </div>

              <div className="rounded-3xl bg-red-50 p-4 dark:bg-red-500/15">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Pengeluaran</p>
                <p className="mt-1 text-sm font-black text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpense)}
                </p>
              </div>

              <div className="rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-500/15">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Saldo</p>
                <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 md:p-6"
            data-aos="fade-left"
          >
            <SectionTitle
              eyebrow="Attendance"
              title="Kehadiran Minggu Ini"
              desc="Ringkasan persentase hadir."
              Icon={FiActivity}
            />

            <div className="mt-8 flex h-64 items-end justify-between gap-3 rounded-3xl bg-blue-50/70 p-4 dark:bg-blue-500/8">
              {weeklyAttendance.map((item) => (
                <div
                  key={item.day}
                  className="flex flex-1 flex-col items-center"
                >
                  <div className="flex h-44 w-full items-end justify-center rounded-2xl bg-white/80 p-1 shadow-sm dark:bg-white/8">
                    <div
                      className="w-full rounded-xl bg-linear-to-t from-blue-600 to-cyan-400"
                      style={{ height: `${item.value}%` }}
                    />
                  </div>

                  <p
                    className={`${jetbrains.className} mt-3 text-xs font-black text-slate-500 dark:text-slate-400`}
                  >
                    {item.day}
                  </p>
                  <p className="text-xs font-black text-blue-700 dark:text-blue-300">
                    {item.value}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div
            className="rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 md:p-6"
            data-aos="fade-up"
          >
            <SectionTitle
              eyebrow="Schedule"
              title="Jadwal Hari Ini"
              desc="Pantauan mata kuliah aktif."
              Icon={FiCalendar}
            />

            <div className="mt-6 space-y-3">
              {todaySchedules.map((item) => (
                <div
                  key={`${item.time}-${item.subject}`}
                  className="rounded-3xl border border-blue-100 bg-white/75 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white dark:border-white/8 dark:bg-white/5 dark:hover:border-blue-500/40 dark:hover:bg-white/8"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={`${jetbrains.className} text-xs font-black text-blue-700 dark:text-blue-400`}
                      >
                        {item.time}
                      </p>
                      <h3 className="mt-2 text-sm font-black text-slate-950 dark:text-white">
                        {item.subject}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {item.dosenName} · {item.room}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${getStatusClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 md:p-6"
            data-aos="fade-up"
            data-aos-delay="120"
          >
            <SectionTitle
              eyebrow="Academic Tasks"
              title="Tugas Mata Kuliah"
              desc="Tugas kelas yang perlu diselesaikan mahasiswa."
              Icon={FiTarget}
            />

            <div className="mt-6 space-y-4">
              {tasks.length === 0 && (
                <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-6 text-center dark:border-blue-500/30 dark:bg-blue-500/8">
                  <FiCheckCircle className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">
                    Tidak ada tugas aktif
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Semua tugas mata kuliah sudah selesai atau belum dibuat.
                  </p>
                </div>
              )}

              {tasks.map((item, index) => (
                <div
                  key={`${item.title}-${item.deadline}-${index}`}
                  className="rounded-3xl border border-blue-100 bg-white/75 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white dark:border-white/8 dark:bg-white/5 dark:hover:border-blue-500/40 dark:hover:bg-white/8"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-950 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-black text-blue-700 dark:text-blue-400">
                        <FiBookOpen className="h-3.5 w-3.5" />
                        {item.course}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${getPriorityClass(
                        item.priority,
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black ${getDueStateClass(
                        item.dueState,
                      )}`}
                    >
                      <FiClock className="h-3.5 w-3.5" />
                      {item.dueState} · {item.deadline}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <FiUsers className="h-3.5 w-3.5" />
                      {item.audience}
                    </span>
                  </div>
                </div>
              ))}

              <Link
                href="/task-reminder"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 dark:bg-blue-500 dark:shadow-blue-500/20 dark:hover:bg-blue-600"
              >
                <FiFileText className="h-4 w-4" />
                Lihat semua tugas mata kuliah
              </Link>
            </div>
          </div>

          <div
            className="rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 md:p-6"
            data-aos="fade-up"
            data-aos-delay="240"
          >
            <SectionTitle
              eyebrow="Activity"
              title="Aktivitas Terbaru"
              desc="Log perubahan terakhir."
              Icon={FiRefreshCcw}
            />

            <div className="mt-6 space-y-4">
              {activities.map((item, index) => {
                const Icon = item.Icon;

                return (
                  <div
                    key={`${item.title}-${item.time}-${index}`}
                    className="flex gap-3"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${getToneClass(
                        item.tone,
                      )}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1 border-b border-slate-100 pb-4 dark:border-white/8">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-black text-slate-950 dark:text-white">
                          {item.title}
                        </h3>

                        <span className="shrink-0 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                          {item.time}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"
          data-aos="fade-up"
        >
          <div className="rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 md:p-6">
            <SectionTitle
              eyebrow="System"
              title="Status Sistem"
              desc="Kondisi modul dashboard."
              Icon={FiGrid}
            />

            <div className="mt-6 space-y-3">
              {[
                ["Database", "Connected", FiDatabase],
                ["Authentication", "Secure", FiShield],
                ["Class Module", "Running", FiLayers],
                ["Finance Module", "Synced", FiCreditCard],
              ].map(([label, status, Icon]) => {
                const UsedIcon = Icon as IconType;

                return (
                  <div
                    key={label as string}
                    className="flex items-center justify-between rounded-3xl bg-blue-50/70 p-4 dark:bg-blue-500/8"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-white/10 dark:text-blue-300">
                        <UsedIcon className="h-5 w-5" />
                      </div>

                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                        {label as string}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      {status as string}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-4xl border border-white/80 bg-slate-950 p-5 text-blue-50 shadow-xl shadow-blue-900/10 md:p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-200">
                <FiCode className="h-4 w-4" />
                Admin Console
              </span>

              <div
                className={`${jetbrains.className} mt-6 space-y-2 rounded-3xl border border-white/10 bg-white/5 p-5 text-xs leading-6`}
              >
                <p>
                  <span className="text-cyan-300">const</span> dashboardStatus ={" "}
                  <span className="text-emerald-300">&quot;live&quot;</span>;
                </p>
                <p>
                  <span className="text-cyan-300">const</span> activeClass ={" "}
                  <span className="text-emerald-300">
                    &quot;Teknik Informatika 2&quot;
                  </span>
                  ;
                </p>
                <p>
                  syncData(
                  <span className="text-amber-300">students</span>,{" "}
                  <span className="text-amber-300">finance</span>,{" "}
                  <span className="text-amber-300">schedule</span>);
                </p>
                <p className="text-slate-400">
                  {"// semua modul admin tersinkron dengan database."}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/10 p-4">
                  <FiFileText className="h-5 w-5 text-cyan-300" />
                  <p className="mt-3 text-xs font-bold text-slate-300">
                    Aktivitas
                  </p>
                  <p className="text-lg font-black text-white">
                    {activities.length}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 p-4">
                  <FiClock className="h-5 w-5 text-cyan-300" />
                  <p className="mt-3 text-xs font-bold text-slate-300">
                    Tugas Aktif
                  </p>
                  <p className="text-lg font-black text-white">
                    {tasks.length}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 p-4">
                  <FiAlertCircle className="h-5 w-5 text-cyan-300" />
                  <p className="mt-3 text-xs font-bold text-slate-300">
                    Jadwal Hari Ini
                  </p>
                  <p className="text-lg font-black text-white">
                    {todaySchedules.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
