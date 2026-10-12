"use client";

import { useEffect, useState } from "react";
import { EditGate } from "@/components/editGate";
import type { KasKeluar } from "@/libs/types";
import { showError, showSuccess } from "@/libs/swal";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

export default function AdminKasKeluar() {
  const [kasKeluar, setKasKeluar] = useState<KasKeluar[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [showForm, setShowForm] = useState(false);

  const fetchKasKeluar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/kas-keluar");
      const data = await res.json();
      setKasKeluar(data.data || []);
    } catch (error) {
      console.error("Failed to fetch kas keluar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchKasKeluar(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/kas-keluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          description: form.description,
          amount: parseInt(form.amount),
          category: form.category,
          date: form.date,
        }),
      });

      if (res.ok) {
        setForm({ description: "", amount: "", category: "", date: new Date().toISOString().split("T")[0] });
        setShowForm(false);
        await showSuccess("Kas keluar tersimpan");
        await fetchKasKeluar();
      } else {
        const result = await res.json().catch(() => null);
        await showError("Kas keluar gagal disimpan", result?.message || "Periksa kembali data yang diisi.");
      }
    } catch (error) {
      console.error("Error:", error);
      await showError("Kas keluar gagal disimpan", "Server tidak dapat dihubungi.");
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const total = kasKeluar.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 pb-12">
      <section className="flex flex-col justify-between gap-5 rounded-[2rem] bg-white p-6 shadow-lg shadow-blue-900/5 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">Keuangan</p><h1 className="mt-2 text-3xl font-black">Kas Keluar</h1>
          <p className="mt-2 text-sm text-slate-500">Total pengeluaran tercatat</p><p className="mt-1 text-2xl font-black text-rose-600">Rp {total.toLocaleString("id-ID")}</p>
        </div>
        <EditGate scope={PERMISSION_SCOPES.cashExpense} action="create">
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-2xl bg-rose-600 px-5 py-3 font-black text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700"
          >
            {showForm ? "Batal" : "Tambah Pengeluaran"}
          </button>
        </EditGate>
      </section>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-6 shadow-lg shadow-blue-900/5">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Kategori (Makan, Transport, dll)"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-rose-400"
            />
            <input
              type="number"
              placeholder="Jumlah"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-rose-400"
            />
            <input
              type="text"
              placeholder="Keterangan"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none md:col-span-2 focus:border-rose-400"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-rose-400"
            />
          </div>
          <EditGate scope={PERMISSION_SCOPES.cashExpense} action="create">
            <button type="submit" className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700">
              Simpan
            </button>
          </EditGate>
        </form>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-blue-900/5">
        <div className="overflow-x-auto"><table className="app-table min-w-[720px]">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left">Tanggal</th>
              <th className="px-6 py-3 text-left">Kategori</th>
              <th className="px-6 py-3 text-left">Keterangan</th>
              <th className="px-6 py-3 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {kasKeluar.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-3">{item.date}</td>
                <td className="px-6 py-3"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">{item.category}</span></td>
                <td className="px-6 py-3">{item.description}</td>
                <td className="px-6 py-3 text-right font-black text-rose-600">Rp {item.amount?.toLocaleString("id-ID")}</td>
              </tr>
            ))}
            {kasKeluar.length === 0 && <tr><td colSpan={4} className="py-12! text-center! text-slate-400!">Belum ada transaksi kas keluar.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </main>
  );
}
