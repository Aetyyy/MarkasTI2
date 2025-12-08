"use client";

import { useEffect, useState } from "react";
import { EditGate } from "@/components/EditGate";
import type { Dosen } from "@/libs/types";

export default function AdminDosen() {
  const [dosen, setDosen] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", nip: "", email: "", phone: "", address: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDosen();
  }, []);

  const fetchDosen = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dosen");
      const data = await res.json();
      setDosen(data.data || []);
    } catch (error) {
      console.error("Failed to fetch dosen:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/dosen/${editingId}` : "/api/dosen";
      const method = editingId ? "PUT" : "POST";
      setSubmitting(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({ name: "", nip: "", email: "", phone: "", address: "" });
        setShowForm(false);
        setEditingId(null);
        fetchDosen();
        alert("Berhasil disimpan");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save dosen");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (d: Dosen) => {
    setEditingId(d.id || null);
    setForm({ name: d.name, nip: d.nip || "", email: d.email || "", phone: d.phone || "", address: d.address || "" });
    setShowForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Hapus dosen ini?")) return;
    try {
      const res = await fetch(`/api/dosen/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) fetchDosen();
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
        <h1 className="text-3xl font-bold">Data Dosen</h1>
        <EditGate>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showForm ? "Batal" : "Tambah Dosen"}
          </button>
        </EditGate>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nama"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border px-4 py-2 rounded"
              disabled={submitting}
            />
            <input
              type="text"
              placeholder="NIP"
              value={form.nip}
              onChange={(e) => setForm({ ...form, nip: e.target.value })}
              className="border px-4 py-2 rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border px-4 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border px-4 py-2 rounded"
            />
          </div>
          <textarea
            placeholder="Alamat"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="border px-4 py-2 rounded w-full mt-4"
            rows={3}
          />
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
              <th className="px-6 py-3 text-left">Nama</th>
              <th className="px-6 py-3 text-left">NIP</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
            </tr>
          </thead>
          <tbody>
            {dosen.map((d) => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3">{d.name}</td>
                <td className="px-6 py-3">{d.nip || "-"}</td>
                <td className="px-6 py-3">{d.email || "-"}</td>
                <td className="px-6 py-3">{d.phone || "-"}</td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(d)} className="text-sm text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(d.id)} className="text-sm text-red-600 hover:underline">Hapus</button>
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
