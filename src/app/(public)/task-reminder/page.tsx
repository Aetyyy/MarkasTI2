"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiRefreshCcw,
  FiTrash2,
} from "react-icons/fi";

type Task = {
  id: string;
  title: string;
  course: string | null;
  category: string | null;
  priority: "RENDAH" | "SEDANG" | "TINGGI";
  status: "BELUM" | "SELESAI";
  dueDate: string;
  reminderTime: string | null;
  description: string | null;
  createdBy: { name: string } | null;
};
type UserOption = { id: string; name: string; nim: string };

export default function TaskReminderPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    course: "",
    category: "Tugas",
    priority: "SEDANG",
    dueDate: "",
    reminderTime: "19:00",
    description: "",
    assignedToId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/tasks", { cache: "no-store" });
    const result = await response.json();
    setLoggedIn(response.status !== 401);
    if (result.ok) {
      setTasks(result.data);
      setUsers(result.users);
      setCanCreate(result.canCreate);
      setForm((current) => ({
        ...current,
        dueDate: current.dueDate || new Date().toISOString().slice(0, 10),
        assignedToId: current.assignedToId || result.users[0]?.id || "",
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const progress = useMemo(
    () =>
      tasks.length
        ? Math.round(
            (tasks.filter((task) => task.status === "SELESAI").length /
              tasks.length) *
              100,
          )
        : 0,
    [tasks],
  );

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setMessage(
      result.ok
        ? "Tugas berhasil dibuat dan notifikasi dikirim."
        : result.message,
    );
    if (result.ok) {
      setForm({ ...form, title: "", description: "" });
      await load();
    }
  }

  async function toggle(task: Task) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        status: task.status === "SELESAI" ? "BELUM" : "SELESAI",
      }),
    });
    await load();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    const result = await response.json();
    setMessage(result.ok ? "Tugas dihapus." : result.message);
    if (result.ok) await load();
  }

  if (!loggedIn)
    return (
      <main className="app-page-canvas min-h-screen px-[var(--app-page-gutter)] pt-32">
        <div className="mx-auto max-w-xl rounded-4xl bg-white p-8 text-center shadow-xl">
          <FiBell className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-2xl font-black">
            Task pribadi membutuhkan akun
          </h1>
          <p className="mt-2 text-slate-500">
            Login untuk melihat tugas yang ditujukan khusus untuk akunmu.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-black text-white"
          >
            Login
          </Link>
        </div>
      </main>
    );

  return (
    <main className="app-page-canvas min-h-screen px-[var(--app-page-gutter)] pb-16 pt-32">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-4xl bg-white p-7 shadow-xl shadow-blue-900/5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700">
                <FiBell /> Task per akun
              </span>
              <h1 className="mt-4 text-4xl font-black">Pengingat Tugas</h1>
              <p className="mt-2 text-sm text-slate-500">
                Data tersimpan di database dan hanya menampilkan tugas milik
                akun yang sedang login.
              </p>
            </div>
            <div className="rounded-3xl bg-blue-600 p-5 text-white">
              <p className="text-xs font-black uppercase">Progress</p>
              <p className="mt-1 text-4xl font-black">{progress}%</p>
            </div>
          </div>
        </section>

        {message && (
          <p className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-blue-700 shadow">
            {message}
          </p>
        )}

        {canCreate && (
          <form
            onSubmit={createTask}
            className="grid gap-3 rounded-4xl bg-white p-6 shadow-lg md:grid-cols-2 xl:grid-cols-4"
          >
            <div className="md:col-span-2 xl:col-span-4">
              <h2 className="text-xl font-black">Buat Tugas</h2>
              <p className="text-xs text-slate-500">
                Khusus pengurus kelas mulai sekretaris dan tingkat di atasnya.
              </p>
            </div>
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Judul tugas"
              className="rounded-2xl border border-blue-100 px-4 py-3"
            />
            <input
              value={form.course}
              onChange={(event) =>
                setForm({ ...form, course: event.target.value })
              }
              placeholder="Mata kuliah"
              className="rounded-2xl border border-blue-100 px-4 py-3"
            />
            <select
              required
              value={form.assignedToId}
              onChange={(event) =>
                setForm({ ...form, assignedToId: event.target.value })
              }
              className="rounded-2xl border border-blue-100 px-4 py-3"
            >
              <option value="">Pilih penerima</option>
              <option value="ALL">Semua Orang</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.nim}
                </option>
              ))}
            </select>
            <select
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value })
              }
              className="rounded-2xl border border-blue-100 px-4 py-3"
            >
              <option>RENDAH</option>
              <option>SEDANG</option>
              <option>TINGGI</option>
            </select>
            <input
              type="date"
              required
              value={form.dueDate}
              onChange={(event) =>
                setForm({ ...form, dueDate: event.target.value })
              }
              className="rounded-2xl border border-blue-100 px-4 py-3"
            />
            <input
              type="time"
              value={form.reminderTime}
              onChange={(event) =>
                setForm({ ...form, reminderTime: event.target.value })
              }
              className="rounded-2xl border border-blue-100 px-4 py-3"
            />
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Detail tugas"
              className="rounded-2xl border border-blue-100 px-4 py-3 md:col-span-2"
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white">
              <FiPlus /> Tambahkan
            </button>
          </form>
        )}

        <section className="rounded-4xl bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Tugas Saya</h2>
            <button
              onClick={() => void load()}
              className="rounded-xl bg-blue-50 p-3 text-blue-700"
            >
              <FiRefreshCcw className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {tasks.map((task) => (
              <article
                key={task.id}
                className={`rounded-3xl border p-5 ${task.status === "SELESAI" ? "border-emerald-100 bg-emerald-50" : "border-blue-100"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-blue-600">
                      {task.course || task.category}
                    </p>
                    <h3 className="mt-1 text-lg font-black">{task.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {task.description || "Tanpa deskripsi"}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {task.priority}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                  <FiClock /> {task.dueDate} · {task.reminderTime || "-"} · oleh{" "}
                  {task.createdBy?.name || "Sistem"}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => void toggle(task)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
                  >
                    <FiCheckCircle />{" "}
                    {task.status === "SELESAI"
                      ? "Buka kembali"
                      : "Tandai selesai"}
                  </button>
                  <button
                    onClick={() => void remove(task.id)}
                    className="rounded-2xl bg-rose-50 px-4 text-rose-600"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!loading && tasks.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              Belum ada tugas untuk akun ini.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
