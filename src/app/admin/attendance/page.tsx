"use client";

import { useEffect, useState } from "react";
import type { Attendance, Dosen } from "@/libs/types";

export default function AdminAttendance() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [dosen, setDosen] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    dosenId: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString("en-GB").slice(0, 5),
    status: "hadir",
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, dosenRes] = await Promise.all([
        fetch("/api/attendance"),
        fetch("/api/dosen"),
      ]);
      const attendanceData = await attendanceRes.json();
      const dosenData = await dosenRes.json();
      setAttendance(attendanceData.data || []);
      setDosen(dosenData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dosenId: parseInt(form.dosenId),
          date: form.date,
          time: form.time,
          status: form.status,
        }),
      });

      if (res.ok) {
        setForm({
          dosenId: "",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-GB").slice(0, 5),
          status: "hadir",
        });
        setShowForm(false);
        fetchData();
      } else {
        alert("Failed to record attendance");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const getDosenName = (id: number) => dosen.find((d) => d.id === id)?.name || "Unknown";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kehadiran Dosen</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? "Batal" : "Catat Kehadiran"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <select
              required
              value={form.dosenId}
              onChange={(e) => setForm({ ...form, dosenId: e.target.value })}
              className="border px-4 py-2 rounded"
            >
              <option value="">Pilih Dosen</option>
              {dosen.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border px-4 py-2 rounded"
            />
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="border px-4 py-2 rounded"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="border px-4 py-2 rounded"
            >
              <option value="hadir">Hadir</option>
              <option value="tidak_hadir">Tidak Hadir</option>
            </select>
          </div>
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600">
            Simpan
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">Nama Dosen</th>
              <th className="px-6 py-3 text-left">Tanggal</th>
              <th className="px-6 py-3 text-left">Jam</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3">{getDosenName(item.dosenId)}</td>
                <td className="px-6 py-3">{item.date}</td>
                <td className="px-6 py-3">{item.time}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-white text-sm ${
                    item.status === "hadir" ? "bg-green-500" : "bg-red-500"
                  }`}>
                    {item.status === "hadir" ? "Hadir" : "Tidak Hadir"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
