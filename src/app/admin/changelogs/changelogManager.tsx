"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiGitCommit,
  FiPlus,
  FiRefreshCcw,
  FiSave,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { confirmDanger, showError, showSuccess } from "@/libs/swal";
import {
  CHANGELOG_TYPES,
  type ChangelogAccess,
  type ChangelogForClient,
  type ChangelogType,
} from "@/types/changelog";

type FormState = {
  id: string;
  version: string;
  title: string;
  summary: string;
  details: string;
  type: ChangelogType;
  isPublished: boolean;
  sortOrder: number;
};

const emptyForm: FormState = {
  id: "",
  version: "",
  title: "",
  summary: "",
  details: "",
  type: "IMPROVEMENT",
  isPublished: true,
  sortOrder: 0,
};

const typeLabels: Record<ChangelogType, string> = {
  FEATURE: "Fitur Baru",
  IMPROVEMENT: "Peningkatan",
  FIX: "Perbaikan Bug",
  SECURITY: "Keamanan",
};

const typeColors: Record<ChangelogType, string> = {
  FEATURE: "bg-blue-100 text-blue-700",
  IMPROVEMENT: "bg-cyan-100 text-cyan-700",
  FIX: "bg-amber-100 text-amber-700",
  SECURITY: "bg-emerald-100 text-emerald-700",
};

function formatDate(value: string | null) {
  if (!value) return "Belum dipublikasikan";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ChangelogManager({
  initialItems,
  access,
}: {
  initialItems: ChangelogForClient[];
  access: ChangelogAccess;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        if (filter === "PUBLISHED") return item.isPublished;
        if (filter === "DRAFT") return !item.isPublished;
        return true;
      }),
    [filter, items],
  );

  const publishedCount = items.filter((item) => item.isPublished).length;
  const editing = Boolean(form.id);
  const canSubmit = editing ? access.update : access.create;

  function openCreate() {
    if (!access.create) return;
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item: ChangelogForClient) {
    if (!access.update) return;
    setForm({
      id: item.id,
      version: item.version,
      title: item.title,
      summary: item.summary,
      details: item.details || "",
      type: item.type,
      isPublished: item.isPublished,
      sortOrder: item.sortOrder,
    });
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setForm(emptyForm);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || saving) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/changelogs", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        data?: ChangelogForClient;
      };
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.message || "Changelog gagal disimpan.");
      }

      setItems((current) =>
        editing
          ? current.map((item) => (item.id === result.data?.id ? result.data : item))
          : [result.data as ChangelogForClient, ...current],
      );
      setShowForm(false);
      setForm(emptyForm);
      router.refresh();
      await showSuccess(
        editing ? "Changelog diperbarui" : "Changelog ditambahkan",
        form.isPublished
          ? "Update langsung tampil di homepage."
          : "Update disimpan sebagai draft.",
      );
    } catch (error) {
      await showError(
        "Gagal menyimpan changelog",
        error instanceof Error ? error.message : "Terjadi kesalahan.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: ChangelogForClient) {
    if (!access.delete) return;
    const confirmed = await confirmDanger(
      `Hapus versi ${item.version}?`,
      "Changelog yang dihapus tidak dapat dipulihkan.",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin/changelogs?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Changelog gagal dihapus.");
      }
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      router.refresh();
      await showSuccess("Changelog dihapus");
    } catch (error) {
      await showError(
        "Gagal menghapus changelog",
        error instanceof Error ? error.message : "Terjadi kesalahan.",
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 py-2">
      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-xl shadow-blue-900/10 backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
              <FiGitCommit className="h-4 w-4" /> Website Updates
            </span>
            <h1 className="mt-4 text-3xl font-black text-slate-950">
              Kelola Changelog
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tulis catatan pembaruan dan tentukan update yang ditampilkan pada
              bagian paling bawah homepage.
            </p>
          </div>
          {access.create && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <FiPlus className="h-5 w-5" /> Tambah Update
            </button>
          )}
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total update</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{items.length}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Dipublikasikan</p>
            <p className="mt-1 text-2xl font-black text-emerald-700">{publishedCount}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Draft</p>
            <p className="mt-1 text-2xl font-black text-amber-700">{items.length - publishedCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl shadow-blue-900/10 backdrop-blur-xl md:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                filter === value
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {value === "ALL" ? "Semua" : value === "PUBLISHED" ? "Published" : "Draft"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.refresh()}
            className="ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100"
          >
            <FiRefreshCcw /> Refresh
          </button>
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 px-6 py-14 text-center">
            <FiGitCommit className="mx-auto h-10 w-10 text-blue-300" />
            <h2 className="mt-4 font-black text-slate-800">Belum ada changelog</h2>
            <p className="mt-1 text-sm text-slate-500">Tambahkan update pertama untuk mulai menampilkannya.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-100 bg-white p-5 transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black text-white">v{item.version}</span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${typeColors[item.type]}`}>{typeLabels[item.type]}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold ${item.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {item.isPublished ? <FiEye /> : <FiEyeOff />}
                        {item.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <h2 className="mt-3 truncate text-lg font-black text-slate-950">{item.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
                      <span className="inline-flex items-center gap-1"><FiClock /> {formatDate(item.publishedAt)}</span>
                      <span>Urutan: {item.sortOrder}</span>
                      {item.authorName && <span>Oleh {item.authorName}</span>}
                    </div>
                  </div>
                  {(access.update || access.delete) && (
                    <div className="flex shrink-0 gap-2">
                      {access.update && (
                        <button type="button" onClick={() => openEdit(item)} className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100">
                          <FiEdit3 /> Edit
                        </button>
                      )}
                      {access.delete && (
                        <button type="button" onClick={() => void remove(item)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-100">
                          <FiTrash2 /> Hapus
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && canSubmit && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
          <form onSubmit={submit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">{editing ? "Edit Update" : "Update Baru"}</span>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{editing ? `Versi ${form.version}` : "Tambah Changelog"}</h2>
              </div>
              <button type="button" onClick={closeForm} className="rounded-full bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200"><FiX className="h-5 w-5" /></button>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Versi
                <input required maxLength={30} value={form.version} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} placeholder="Contoh: 1.4.0" className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white" />
              </label>
              <label className="space-y-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Tipe update
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ChangelogType }))} className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-slate-900 outline-none focus:border-blue-400">
                  {CHANGELOG_TYPES.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 sm:col-span-2">
                Judul
                <input required maxLength={180} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Judul singkat pembaruan" className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-slate-900 outline-none focus:border-blue-400 focus:bg-white" />
              </label>
              <label className="space-y-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 sm:col-span-2">
                Ringkasan
                <textarea required maxLength={500} rows={3} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Ringkasan yang langsung terlihat di homepage" className="w-full resize-y rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-semibold normal-case leading-6 tracking-normal text-slate-900 outline-none focus:border-blue-400 focus:bg-white" />
                <span className="block text-right text-[11px] font-medium normal-case tracking-normal text-slate-400">{form.summary.length}/500</span>
              </label>
              <label className="space-y-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 sm:col-span-2">
                Detail (opsional)
                <textarea rows={6} value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} placeholder={"- Penjelasan perubahan pertama\n- Penjelasan perubahan berikutnya"} className="w-full resize-y rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-semibold normal-case leading-6 tracking-normal text-slate-900 outline-none focus:border-blue-400 focus:bg-white" />
              </label>
              <label className="space-y-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Prioritas urutan
                <input type="number" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-slate-900 outline-none focus:border-blue-400" />
              </label>
              <button type="button" onClick={() => setForm((current) => ({ ...current, isPublished: !current.isPublished }))} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${form.isPublished ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                <span>
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">Status</span>
                  <span className={`mt-1 block text-sm font-black ${form.isPublished ? "text-emerald-700" : "text-slate-600"}`}>{form.isPublished ? "Publikasikan" : "Simpan Draft"}</span>
                </span>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${form.isPublished ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>{form.isPublished ? <FiCheckCircle /> : <FiEyeOff />}</span>
              </button>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeForm} disabled={saving} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-500 hover:bg-slate-50">Batal</button>
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                {saving ? <FiRefreshCcw className="animate-spin" /> : <FiSave />}
                {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Changelog"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
