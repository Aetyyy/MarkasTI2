"use client";

import { useEffect, useState } from "react";
import type { Dosen } from "@/libs/types";

export default function AdminDosen() {
  const [dosen, setDosen] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", nip: "", email: "", phone: "", address: "" });
  const [showForm, setShowForm] = useState(false);

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
      const res = await fetch("/api/dosen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({ name: "", nip: "", email: "", phone: "", address: "" });
        setShowForm(false);
        fetchDosen();
      } else {
        alert("Failed to add dosen");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Data Dosen</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? "Batal" : "Tambah Dosen"}
        </button>
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
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600">
            Simpan
          </button>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
