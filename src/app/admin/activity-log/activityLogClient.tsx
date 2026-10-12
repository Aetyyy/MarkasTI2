"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDatabase,
  FiImage,
  FiRefreshCcw,
  FiSearch,
  FiShield,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";

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

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const kindOptions: Array<{ value: "ALL" | ActivityKind; label: string }> = [
  { value: "ALL", label: "Semua Aktivitas" },
  { value: "USER", label: "User" },
  { value: "CASH", label: "Kas" },
  { value: "SCHEDULE", label: "Jadwal" },
  { value: "GALLERY", label: "Gallery" },
  { value: "ATTENDANCE", label: "Kehadiran" },
  { value: "TASK", label: "Tugas" },
  { value: "SECURITY", label: "Role & Security" },
  { value: "TEAM", label: "Team" },
];

const kindMeta: Record<
  ActivityKind,
  { label: string; Icon: IconType; tone: string }
> = {
  USER: { label: "User", Icon: FiUsers, tone: "bg-blue-100 text-blue-700" },
  CASH: {
    label: "Kas",
    Icon: FiCreditCard,
    tone: "bg-emerald-100 text-emerald-700",
  },
  SCHEDULE: {
    label: "Jadwal",
    Icon: FiCalendar,
    tone: "bg-indigo-100 text-indigo-700",
  },
  GALLERY: {
    label: "Gallery",
    Icon: FiImage,
    tone: "bg-fuchsia-100 text-fuchsia-700",
  },
  ATTENDANCE: {
    label: "Kehadiran",
    Icon: FiTarget,
    tone: "bg-cyan-100 text-cyan-700",
  },
  TASK: {
    label: "Tugas",
    Icon: FiActivity,
    tone: "bg-amber-100 text-amber-700",
  },
  SECURITY: {
    label: "Security",
    Icon: FiShield,
    tone: "bg-rose-100 text-rose-700",
  },
  TEAM: {
    label: "Team",
    Icon: FiDatabase,
    tone: "bg-violet-100 text-violet-700",
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ActivityLogClient() {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"ALL" | ActivityKind>("ALL");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          kind,
          q: query.trim(),
        });
        const response = await fetch(`/api/admin/activity-log?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          ok: boolean;
          message?: string;
          data?: ActivityEntry[];
          pagination?: Pagination;
        };

        if (!response.ok || !result.ok || !result.data || !result.pagination) {
          throw new Error(result.message || "Gagal memuat activity log.");
        }

        setItems(result.data);
        setPagination(result.pagination);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Gagal memuat activity log.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [kind, page, query, refreshKey]);

  const summary = useMemo(() => {
    const actors = new Set(items.map((item) => item.actor));
    return { visible: items.length, actors: actors.size };
  }, [items]);

  const refresh = () => {
    setPage(1);
    setRefreshKey((current) => current + 1);
  };

  return (
    <main className="w-full text-[var(--app-text)]">
      <section className="mx-auto w-full max-w-[1500px] space-y-6 pb-10">
        <div className="rounded-4xl border border-white/80 bg-white/80 p-6 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                <FiActivity className="h-4 w-4" /> Activity Log
              </span>
              <h1 className="mt-5 text-3xl font-black text-slate-950">
                Riwayat Aktivitas Sistem
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Pantau perubahan user, kas, jadwal, gallery, attendance, tugas,
                role, dan konfigurasi team dari satu halaman.
              </p>
            </div>

            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-60"
            >
              <FiRefreshCcw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-blue-50 p-4">
              <p className="text-xs font-bold text-slate-500">Total ditemukan</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {pagination.total}
              </p>
            </div>
            <div className="rounded-3xl bg-cyan-50 p-4">
              <p className="text-xs font-bold text-slate-500">Tampil di halaman</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {summary.visible}
              </p>
            </div>
            <div className="rounded-3xl bg-indigo-50 p-4">
              <p className="text-xs font-bold text-slate-500">Aktor terlihat</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {summary.actors}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-white/80 bg-white/80 p-4 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
          <div className="grid gap-3 md:grid-cols-[1fr_260px]">
            <label className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari aktivitas, aktor, atau keterangan..."
                className="w-full rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <select
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as "ALL" | ActivityKind);
                setPage(1);
              }}
              className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              {kindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {loading &&
            Array.from({ length: 5 }, (_, index) => (
              <div
                key={`activity-loading-${index}`}
                className="h-28 animate-pulse rounded-3xl bg-white/75 shadow-lg shadow-blue-900/5"
              />
            ))}

          {!loading && error && (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-center font-bold text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-white/75 p-10 text-center text-sm font-bold text-slate-500">
              Tidak ada aktivitas yang cocok dengan filter.
            </div>
          )}

          {!loading &&
            !error &&
            items.map((item) => {
              const meta = kindMeta[item.kind];
              const Icon = meta.Icon;

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-blue-200"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${meta.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${meta.tone}`}>
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                          {item.action}
                        </span>
                      </div>
                      <h2 className="mt-3 text-base font-black text-slate-950">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <FiUsers /> {item.actor}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <FiClock /> {formatDate(item.occurredAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>

        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between rounded-3xl border border-white/80 bg-white/80 p-4 shadow-lg shadow-blue-900/5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 disabled:opacity-40"
            >
              <FiChevronLeft /> Sebelumnya
            </button>
            <span className="text-xs font-black text-slate-600">
              Halaman {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1),
                )
              }
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 disabled:opacity-40"
            >
              Berikutnya <FiChevronRight />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
