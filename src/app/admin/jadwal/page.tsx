"use client";

import { useEffect, useState } from "react";
import { EditGate } from "@/components/EditGate";
import type { Jadwal } from "@/libs/types";

export default function AdminJadwal() {
  const [items, setItems] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().split("T")[0], time: "09:00", description: "", location: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jadwal");
      const data = await res.json();
      setItems(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/jadwal/${editingId}` : "/api/jadwal";
      const method = editingId ? "PUT" : "POST";
      setSubmitting(true);
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm({ title: "", date: new Date().toISOString().split("T")[0], time: "09:00", description: "", location: "" });
        fetchData();
        alert("Berhasil disimpan");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save jadwal");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (it: Jadwal) => {
    setEditingId(it.id || null);
    setForm({ title: it.title, date: it.date, time: it.time || "09:00", description: it.description || "", location: it.location || "" });
    setShowForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      const res = await fetch(`/api/jadwal/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) fetchData();
      else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Jadwal</h1>
        <EditGate>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            {showForm ? "Batal" : "Tambah Jadwal"}
          </button>
        </EditGate>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Judul" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border px-4 py-2 rounded" disabled={submitting} />
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border px-4 py-2 rounded" disabled={submitting} />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="border px-4 py-2 rounded" disabled={submitting} />
            <input type="text" placeholder="Lokasi" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border px-4 py-2 rounded" disabled={submitting} />
          </div>
          <textarea placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border px-4 py-2 rounded w-full mt-4" rows={3} disabled={submitting} />
          <EditGate>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600 disabled:opacity-50" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </EditGate>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">Tanggal</th>
              <th className="px-6 py-3 text-left">Waktu</th>
              <th className="px-6 py-3 text-left">Judul</th>
              <th className="px-6 py-3 text-left">Lokasi</th>
              <th className="px-6 py-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3">{it.date}</td>
                <td className="px-6 py-3">{it.time || '-'}
                </td>
                <td className="px-6 py-3">{it.title}</td>
                <td className="px-6 py-3">{it.location || '-'}</td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(it)} className="text-sm text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(it.id)} className="text-sm text-red-600 hover:underline">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
