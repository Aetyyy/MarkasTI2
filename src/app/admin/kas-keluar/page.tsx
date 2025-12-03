"use client";

import { useEffect, useState } from "react";
import { EditGate } from "@/components/EditGate";
import type { KasKeluar } from "@/libs/types";

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

  useEffect(() => {
    fetchKasKeluar();
  }, []);

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
        fetchKasKeluar();
      } else {
        alert("Failed to add kas keluar");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const total = kasKeluar.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kas Keluar</h1>
          <p className="text-lg text-gray-600 mt-2">Total: Rp {total.toLocaleString()}</p>
        </div>
        <EditGate>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            {showForm ? "Batal" : "Tambah Pengeluaran"}
          </button>
        </EditGate>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Kategori (Makan, Transport, dll)"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border px-4 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Jumlah"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="border px-4 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Keterangan"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border px-4 py-2 rounded col-span-2"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border px-4 py-2 rounded"
            />
          </div>
          <EditGate>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600">
              Simpan
            </button>
          </EditGate>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">Tanggal</th>
              <th className="px-6 py-3 text-left">Kategori</th>
              <th className="px-6 py-3 text-left">Keterangan</th>
              <th className="px-6 py-3 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {kasKeluar.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3">{item.date}</td>
                <td className="px-6 py-3">{item.category}</td>
                <td className="px-6 py-3">{item.description}</td>
                <td className="px-6 py-3 text-right font-semibold">Rp {item.amount?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
