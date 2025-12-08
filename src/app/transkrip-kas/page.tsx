"use client";

import { useEffect, useState } from "react";

export default function TranskripKasPage() {
  const [masuk, setMasuk] = useState<any[]>([]);
  const [keluar, setKeluar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [r1, r2] = await Promise.all([fetch('/api/kas-masuk'), fetch('/api/kas-keluar')]);
        const d1 = await r1.json();
        const d2 = await r2.json();
        setMasuk(d1.data || []);
        setKeluar(d2.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <main className="pt-16 md:pt-28 bg-rose-50 min-h-screen flex items-center justify-center">Loading...</main>;

  const totalMasuk = masuk.reduce((s, i) => s + (i.amount || 0), 0);
  const totalKeluar = keluar.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <main className="pt-16 md:pt-28 bg-rose-50 min-h-screen">
      <section className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Transkrip Uang Kas</h1>
        <p className="text-sm text-slate-600 mb-6">PEMASUKAN DAN PENGELUARAN KAS.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-slate-500">Total Pemasukan</div>
            <div className="text-xl font-semibold">Rp {totalMasuk.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-slate-500">Total Pengeluaran</div>
            <div className="text-xl font-semibold">Rp {totalKeluar.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-slate-500">Saldo</div>
            <div className="text-xl font-semibold">Rp {(totalMasuk - totalKeluar).toLocaleString()}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Daftar Pemasukan</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-600">
                <tr><th>Tanggal</th><th>Keterangan</th><th className="text-right">Jumlah</th></tr>
              </thead>
              <tbody>
                {masuk.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="py-2">{m.date}</td>
                    <td className="py-2">{m.description}</td>
                    <td className="py-2 text-right">Rp {m.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Daftar Pengeluaran</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-600">
                <tr><th>Tanggal</th><th>Kategori</th><th className="text-right">Jumlah</th></tr>
              </thead>
              <tbody>
                {keluar.map((k) => (
                  <tr key={k.id} className="border-t">
                    <td className="py-2">{k.date}</td>
                    <td className="py-2">{k.category} {k.description ? `- ${k.description}` : ''}</td>
                    <td className="py-2 text-right">Rp {k.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
