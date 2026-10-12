"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FiCheckCircle, FiEdit2, FiPlus, FiRefreshCcw, FiTrash2, FiUsers } from "react-icons/fi";
import { getCrudAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { confirmDanger, showError, showSuccess } from "@/libs/swal";

type Dosen = { id: number; name: string };
type RecordItem = {
  id: string;
  dosenId: number;
  date: string;
  time: string;
  status: "HADIR" | "IZIN" | "SAKIT" | "ALPHA" | "TERLAMBAT";
  note: string | null;
  dosen: { name: string };
};

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminAttendance() {
  const { data: session } = useSession();
  const access = getCrudAccess(session?.user, PERMISSION_SCOPES.attendance);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [dosen, setDosen] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ dosenId: "", date: today(), time: "08:00", status: "HADIR", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [attendanceResponse, dosenResponse] = await Promise.all([
      fetch("/api/dosen-attendance", { cache: "no-store" }),
      fetch("/api/dosen-attendance/options", { cache: "no-store" }),
    ]);
    const [attendanceResult, dosenResult] = await Promise.all([attendanceResponse.json(), dosenResponse.json()]);
    setRecords(attendanceResult.data || []);
    setDosen(dosenResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/dosen-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setMessage(result.ok ? "Kehadiran dosen berhasil disimpan." : result.message);
    if (result.ok) { await showSuccess("Kehadiran tersimpan"); setEditingId(null); await load(); }
    else await showError("Gagal menyimpan kehadiran", result.message);
  }

  async function remove(id: string) {
    if (!(await confirmDanger("Hapus catatan kehadiran?", "Data ini tidak dapat dikembalikan."))) return;
    const response = await fetch(`/api/dosen-attendance?id=${id}`, { method: "DELETE" });
    const result = await response.json();
    setMessage(result.ok ? "Catatan dihapus." : result.message);
    if (result.ok) { await showSuccess("Catatan dihapus"); await load(); }
    else await showError("Catatan gagal dihapus", result.message);
  }

  function edit(record: RecordItem) {
    setEditingId(record.id);
    setForm({
      dosenId: String(record.dosenId),
      date: record.date,
      time: record.time || "08:00",
      status: record.status,
      note: record.note || "",
    });
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 pb-12">
      <section className="rounded-4xl bg-white p-6 shadow-lg shadow-blue-900/5">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700"><FiUsers /> Akademik</span>
        <h1 className="mt-4 text-3xl font-black">Kehadiran Dosen</h1>
        <p className="mt-2 text-sm text-slate-500">Catat status dosen per tanggal. Data pada tanggal yang sama akan diperbarui, bukan diduplikasi.</p>
      </section>

      {(access.create || editingId) && <form onSubmit={submit} className="grid gap-3 rounded-4xl bg-white p-5 shadow-lg shadow-blue-900/5 md:grid-cols-2 xl:grid-cols-6">
        <select required disabled={Boolean(editingId)} value={form.dosenId} onChange={(event) => setForm({ ...form, dosenId: event.target.value })} className="rounded-2xl border border-blue-100 px-4 py-3 disabled:bg-slate-100 xl:col-span-2"><option value="">Pilih dosen</option>{dosen.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <input required disabled={Boolean(editingId)} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="rounded-2xl border border-blue-100 px-4 py-3 disabled:bg-slate-100" />
        <input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="rounded-2xl border border-blue-100 px-4 py-3" />
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-2xl border border-blue-100 px-4 py-3"><option>HADIR</option><option>TERLAMBAT</option><option>IZIN</option><option>SAKIT</option><option>ALPHA</option></select>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white">{editingId ? <FiEdit2 /> : <FiPlus />} {editingId ? "Perbarui" : "Simpan"}</button>
        <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Keterangan (opsional)" className="rounded-2xl border border-blue-100 px-4 py-3 md:col-span-2 xl:col-span-6" />
      </form>}

      {message && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}

      <section className="overflow-hidden rounded-4xl bg-white shadow-lg shadow-blue-900/5">
        <div className="flex items-center justify-between p-5"><h2 className="text-xl font-black">Riwayat Kehadiran</h2><button onClick={() => void load()} className="rounded-xl bg-blue-50 p-3 text-blue-700"><FiRefreshCcw className={loading ? "animate-spin" : ""} /></button></div>
        <div className="overflow-x-auto">
          <table className="app-table min-w-[820px]">
            <thead><tr><th>Dosen</th><th>Tanggal</th><th>Jam</th><th>Status</th><th>Keterangan</th>{(access.update || access.delete) && <th>Aksi</th>}</tr></thead>
            <tbody>
              {records.map((record) => <tr key={record.id}><td className="font-black! text-[var(--app-text)]!">{record.dosen.name}</td><td>{record.date}</td><td><span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-bold text-slate-700 dark:text-slate-300">{record.time || "-"}</span></td><td><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-black ${record.status === "HADIR" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400" : record.status === "ALPHA" ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400" : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"}`}><FiCheckCircle /> {record.status}</span></td><td>{record.note || "-"}</td>{(access.update || access.delete) && <td className="space-x-2">{access.update && <button onClick={() => edit(record)} className="rounded-xl bg-blue-50 dark:bg-blue-900/40 p-2 text-blue-600 dark:text-blue-400 transition hover:bg-blue-600 hover:text-white"><FiEdit2 /></button>}{access.delete && <button onClick={() => void remove(record.id)} className="rounded-xl bg-rose-50 dark:bg-rose-900/40 p-2 text-rose-600 dark:text-rose-400 transition hover:bg-rose-600 hover:text-white"><FiTrash2 /></button>}</td>}</tr>)}
              {!loading && records.length === 0 && <tr><td colSpan={access.update || access.delete ? 6 : 5} className="py-12! text-center! text-slate-400!">Belum ada riwayat kehadiran.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
