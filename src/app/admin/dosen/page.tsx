"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FiBookOpen, FiEdit2, FiPlus, FiSave, FiTrash2, FiUser, FiX } from "react-icons/fi";
import { getCrudAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { confirmDanger, showError, showSuccess } from "@/libs/swal";

type Course = {
  id: number;
  code: string;
  name: string;
  sks: number;
  isActive: boolean;
  _count?: { jadwal: number };
};
type Lecturer = {
  id: number;
  name: string;
  nip: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  mataKuliah: Array<{ mataKuliah: Course }>;
};

const emptyLecturer = { id: 0, name: "", nip: "", email: "", phone: "", address: "", mataKuliahIds: [] as number[] };
const emptyCourse = { id: 0, code: "", name: "", sks: 2, isActive: true };
const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

export default function DosenDashboardPage() {
  const { data: session } = useSession();
  const access = getCrudAccess(session?.user, PERMISSION_SCOPES.dosen);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturerForm, setLecturerForm] = useState(emptyLecturer);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [lecturerModal, setLecturerModal] = useState(false);
  const [courseModal, setCourseModal] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [dosenResponse, courseResponse] = await Promise.all([
      fetch("/api/dosen", { cache: "no-store" }),
      fetch("/api/mata-kuliah", { cache: "no-store" }),
    ]);
    const [dosenResult, courseResult] = await Promise.all([dosenResponse.json(), courseResponse.json()]);
    if (dosenResult.ok) setLecturers(dosenResult.data);
    if (courseResult.ok) setCourses(courseResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const assignedPairs = useMemo(
    () => lecturers.reduce((total, lecturer) => total + lecturer.mataKuliah.length, 0),
    [lecturers],
  );

  async function saveLecturer(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(lecturerForm.id ? `/api/dosen/${lecturerForm.id}` : "/api/dosen", {
      method: lecturerForm.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lecturerForm),
    });
    const result = await response.json();
    setMessage(result.ok ? "Data dosen berhasil disimpan." : result.message);
    if (result.ok) { await showSuccess("Dosen tersimpan", "Data dan mata kuliah pengampu telah diperbarui."); setLecturerModal(false); setLecturerForm(emptyLecturer); await load(); }
    else await showError("Gagal menyimpan dosen", result.message);
  }

  async function saveCourse(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/mata-kuliah", {
      method: courseForm.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseForm),
    });
    const result = await response.json();
    setMessage(result.ok ? "Mata kuliah berhasil disimpan." : result.message);
    if (result.ok) { await showSuccess("Mata kuliah tersimpan"); setCourseModal(false); setCourseForm(emptyCourse); await load(); }
    else await showError("Gagal menyimpan mata kuliah", result.message);
  }

  async function removeLecturer(id: number) {
    if (!(await confirmDanger("Hapus dosen ini?", "Relasi mata kuliah dan data kehadiran dosen ikut disesuaikan."))) return;
    const response = await fetch(`/api/dosen/${id}`, { method: "DELETE" });
    if (response.ok) { await showSuccess("Dosen dihapus"); await load(); }
    else await showError("Dosen gagal dihapus");
  }

  async function removeCourse(id: number) {
    if (!(await confirmDanger("Hapus mata kuliah ini?", "Jadwal lama tetap ada, tetapi relasi mata kuliahnya akan dilepas."))) return;
    const response = await fetch(`/api/mata-kuliah?id=${id}`, { method: "DELETE" });
    if (response.ok) { await showSuccess("Mata kuliah dihapus"); await load(); }
    else await showError("Mata kuliah gagal dihapus");
  }

  function editLecturer(item: Lecturer) {
    setLecturerForm({
      id: item.id,
      name: item.name,
      nip: item.nip || "",
      email: item.email || "",
      phone: item.phone || "",
      address: item.address || "",
      mataKuliahIds: item.mataKuliah.map((entry) => entry.mataKuliah.id),
    });
    setLecturerModal(true);
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 text-[var(--app-text)]">
      <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-950/5 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700"><FiBookOpen /> Akademik</span><h1 className="mt-4 text-3xl font-black md:text-4xl">Dosen & Mata Kuliah</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Satu sumber data untuk dosen, mata kuliah yang diampu, dan penyusunan jadwal kelas.</p></div>
          {access.create && <div className="flex gap-2"><button onClick={() => { setCourseForm(emptyCourse); setCourseModal(true); }} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700"><FiPlus /> Mata Kuliah</button><button onClick={() => { setLecturerForm(emptyLecturer); setLecturerModal(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20"><FiPlus /> Dosen</button></div>}
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">{[["Dosen", lecturers.length], ["Mata Kuliah", courses.length], ["Relasi Pengampu", assignedPairs]].map(([label, value]) => <div key={label} className="rounded-3xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div>
      </section>

      {message && <p className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5"><h2 className="text-xl font-black">Daftar Dosen</h2><div className="mt-5 space-y-3">{lecturers.map((item) => <article key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-600 text-white"><FiUser /></span><div className="min-w-0 flex-1"><h3 className="font-black">{item.name}</h3><p className="mt-1 text-xs text-slate-500">{item.nip || "NIP belum ada"} · {item.email || "Email belum ada"}</p><div className="mt-3 flex flex-wrap gap-2">{item.mataKuliah.map(({ mataKuliah }) => <span key={mataKuliah.id} className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-black text-blue-700">{mataKuliah.code} · {mataKuliah.name}</span>)}{item.mataKuliah.length === 0 && <span className="text-xs text-slate-400">Belum mempunyai mata kuliah</span>}</div></div>{access.update && <button onClick={() => editLecturer(item)} className="rounded-xl bg-white p-2 text-blue-600"><FiEdit2 /></button>}{access.delete && <button onClick={() => void removeLecturer(item.id)} className="rounded-xl bg-white p-2 text-rose-600"><FiTrash2 /></button>}</div></article>)}{!loading && lecturers.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Belum ada dosen.</p>}</div></section>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5"><h2 className="text-xl font-black">Mata Kuliah</h2><div className="mt-5 space-y-3">{courses.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-3xl border border-slate-100 p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><FiBookOpen /></span><div className="min-w-0 flex-1"><p className="text-xs font-black text-blue-600">{item.code} · {item.sks} SKS</p><h3 className="truncate font-black">{item.name}</h3><p className="text-xs text-slate-400">{item._count?.jadwal || 0} jadwal</p></div>{access.update && <button onClick={() => { setCourseForm(item); setCourseModal(true); }} className="p-2 text-blue-600"><FiEdit2 /></button>}{access.delete && <button onClick={() => void removeCourse(item.id)} className="p-2 text-rose-600"><FiTrash2 /></button>}</article>)}</div></section>
      </div>

      {lecturerModal && <div className="fixed inset-0 z-[999] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><form onSubmit={saveLecturer} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">{lecturerForm.id ? "Edit Dosen" : "Tambah Dosen"}</h2><button type="button" onClick={() => setLecturerModal(false)}><FiX /></button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><input required className={field} placeholder="Nama dosen" value={lecturerForm.name} onChange={(e) => setLecturerForm({ ...lecturerForm, name: e.target.value })} /><input className={field} placeholder="NIP" value={lecturerForm.nip} onChange={(e) => setLecturerForm({ ...lecturerForm, nip: e.target.value })} /><input type="email" className={field} placeholder="Email" value={lecturerForm.email} onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })} /><input className={field} placeholder="Telepon" value={lecturerForm.phone} onChange={(e) => setLecturerForm({ ...lecturerForm, phone: e.target.value })} /><textarea className={`${field} md:col-span-2`} placeholder="Alamat" value={lecturerForm.address} onChange={(e) => setLecturerForm({ ...lecturerForm, address: e.target.value })} /></div><p className="mt-5 text-sm font-black">Mata kuliah yang diampu</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{courses.map((course) => { const checked = lecturerForm.mataKuliahIds.includes(course.id); return <button key={course.id} type="button" onClick={() => setLecturerForm({ ...lecturerForm, mataKuliahIds: checked ? lecturerForm.mataKuliahIds.filter((id) => id !== course.id) : [...lecturerForm.mataKuliahIds, course.id] })} className={`rounded-2xl border p-3 text-left text-sm ${checked ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200"}`}><span className="font-black">{course.code}</span><span className="block text-xs">{course.name}</span></button>; })}</div><button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white"><FiSave /> Simpan Dosen</button></form></div>}

      {courseModal && <div className="fixed inset-0 z-[999] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><form onSubmit={saveCourse} className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">{courseForm.id ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}</h2><button type="button" onClick={() => setCourseModal(false)}><FiX /></button></div><div className="mt-5 space-y-3"><input required className={field} placeholder="Kode, contoh IF204" value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} /><input required className={field} placeholder="Nama mata kuliah" value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} /><input type="number" min={1} max={8} className={field} value={courseForm.sks} onChange={(e) => setCourseForm({ ...courseForm, sks: Number(e.target.value) })} /></div><button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white"><FiSave /> Simpan Mata Kuliah</button></form></div>}
    </main>
  );
}
