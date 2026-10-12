"use client";

import { useState } from "react";
import { FiBell, FiEdit2, FiPlus, FiSend, FiTrash2 } from "react-icons/fi";
import { confirmDanger, showError, showSuccess } from "@/libs/swal";

type Item = { id: string; title: string; body: string; url: string | null; isPublished: boolean; publishedAt: string | null; createdAt: string };
type Access = { create: boolean; read: boolean; update: boolean; delete: boolean };
const blank = { id: "", title: "", body: "", url: "", isPublished: false };

export default function AnnouncementManager({ initialItems, access }: { initialItems: Item[]; access: Access }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const canSave = form.id ? access.update : access.create;

  async function save(publish: boolean) {
    if (!form.title.trim() || !form.body.trim() || busy) return;
    setBusy(true);
    try {
      const editing = Boolean(form.id);
      const response = await fetch("/api/admin/announcements", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isPublished: publish, ...(editing ? {} : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "Pengumuman gagal disimpan.");
      const item = { ...result.data, publishedAt: result.data.publishedAt ? new Date(result.data.publishedAt).toISOString() : null, createdAt: new Date(result.data.createdAt).toISOString() } as Item;
      setItems((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
      setForm(blank);
      await showSuccess(publish ? "Pengumuman diterbitkan" : "Draft tersimpan", publish ? "Notifikasi akan dikirim sesuai preferensi setiap pengguna." : undefined);
    } catch (error) {
      await showError("Gagal menyimpan", error instanceof Error ? error.message : "Silakan coba lagi.");
    } finally { setBusy(false); }
  }

  async function remove(item: Item) {
    if (!access.delete || !(await confirmDanger("Hapus pengumuman?", item.title))) return;
    const response = await fetch("/api/admin/announcements", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
    if (!response.ok) return void showError("Tidak dapat menghapus", "Coba lagi nanti.");
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    await showSuccess("Pengumuman dihapus");
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-7 shadow-[var(--app-shadow)]">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-accent-soft)] px-3 py-2 text-xs font-black uppercase tracking-widest text-[var(--app-accent)]"><FiBell /> Papan informasi</span>
        <h1 className="mt-4 text-3xl font-black text-[var(--app-text)]">Kelola Pengumuman</h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">Pengumuman aktif tampil sebagai teks berjalan di halaman portal dan dapat mengirim notifikasi.</p>
      </header>
      {(access.create || access.update) && <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-6 shadow-sm">
        <h2 className="mb-4 font-black text-[var(--app-text)]">{form.id ? "Ubah pengumuman" : "Buat pengumuman"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-[var(--app-muted)]">Judul<input maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 text-[var(--app-text)]" /></label>
          <label className="text-sm font-bold text-[var(--app-muted)]">Tautan internal (opsional)<input maxLength={255} placeholder="/gallery" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-2 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 text-[var(--app-text)]" /></label>
          <label className="text-sm font-bold text-[var(--app-muted)] sm:col-span-2">Isi<textarea maxLength={1000} rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="mt-2 w-full resize-y rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 text-[var(--app-text)]" /></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {form.id && <button type="button" onClick={() => setForm(blank)} className="rounded-xl border border-[var(--app-border)] px-4 py-2.5 font-bold text-[var(--app-text)]">Batal edit</button>}
          {canSave && <button type="button" disabled={busy} onClick={() => void save(false)} className="rounded-xl border border-[var(--app-border)] px-4 py-2.5 font-bold text-[var(--app-text)] disabled:opacity-50">Simpan draft</button>}
          {canSave && <button type="button" disabled={busy} onClick={() => void save(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-2.5 font-bold text-white disabled:opacity-50">{form.id ? <FiSend /> : <FiPlus />}{busy ? "Menyimpan…" : "Terbitkan"}</button>}
        </div>
      </section>}
      <section className="space-y-3">{items.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-5">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${item.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{item.isPublished ? "Terbit" : "Draft"}</span>
        <div className="min-w-0 flex-1"><h3 className="font-black text-[var(--app-text)]">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm text-[var(--app-muted)]">{item.body}</p></div>
        {access.update && <button type="button" aria-label="Edit" onClick={() => setForm({ id: item.id, title: item.title, body: item.body, url: item.url || "", isPublished: item.isPublished })} className="rounded-xl border border-[var(--app-border)] p-3 text-[var(--app-accent)]"><FiEdit2 /></button>}
        {access.delete && <button type="button" aria-label="Hapus" onClick={() => void remove(item)} className="rounded-xl border border-rose-200 p-3 text-rose-600"><FiTrash2 /></button>}
      </article>)}{items.length === 0 && <p className="rounded-2xl border border-dashed border-[var(--app-border)] p-8 text-center text-[var(--app-muted)]">Belum ada pengumuman.</p>}</section>
    </main>
  );
}
