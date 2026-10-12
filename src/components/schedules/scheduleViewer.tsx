"use client";

import { useEffect, useMemo, useState } from "react";
import { FiBookOpen, FiClock, FiMapPin, FiUser } from "react-icons/fi";
import type { JadwalDayValue, ScheduleForClient } from "@/types/scheduleManagement";
import { getJadwalDayLabel, jadwalDayOptions } from "@/types/scheduleManagement";

type FilterDay = JadwalDayValue | "SEMUA";

function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function todayValue(): JadwalDayValue | null {
  return ([null, "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"] as const)[new Date().getDay()] || null;
}

export default function ScheduleViewer({ schedules }: { schedules: ScheduleForClient[] }) {
  const [selectedDay, setSelectedDay] = useState<FilterDay>("SEMUA");
  const [clock, setClock] = useState({ day: null as JadwalDayValue | null, minutes: -1 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock({ day: todayValue(), minutes: now.getHours() * 60 + now.getMinutes() });
    };
    const frame = window.requestAnimationFrame(update);
    const interval = window.setInterval(update, 30_000);
    return () => { window.cancelAnimationFrame(frame); window.clearInterval(interval); };
  }, []);

  const todaySchedules = useMemo(
    () => schedules.filter((item) => item.day === clock.day),
    [clock.day, schedules],
  );
  const nextSchedule = useMemo(
    () => todaySchedules.find((item) => timeToMinutes(item.startTime) > clock.minutes),
    [clock.minutes, todaySchedules],
  );
  const grouped = useMemo(
    () => jadwalDayOptions
      .filter((day) => selectedDay === "SEMUA" || selectedDay === day.value)
      .map((day) => ({ ...day, items: schedules.filter((item) => item.day === day.value) })),
    [schedules, selectedDay],
  );

  return (
    <div className="space-y-7">
      <section className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl shadow-slate-950/15">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />
          <p className="relative text-xs font-black uppercase tracking-[0.24em] text-blue-300">Kelas berikutnya</p>
          <h2 className="relative mt-4 text-2xl font-black md:text-3xl">{nextSchedule?.title || "Tidak ada kelas berikutnya"}</h2>
          {nextSchedule && <div className="relative mt-5 flex flex-wrap gap-3 text-sm text-slate-300"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"><FiClock /> {nextSchedule.startTime}{nextSchedule.endTime ? `–${nextSchedule.endTime}` : ""}</span>{nextSchedule.location && <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"><FiMapPin /> {nextSchedule.location}</span>}</div>}
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-950/5 lg:grid-cols-1">
          <div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs font-bold text-slate-400">Hari ini</p><p className="mt-1 text-xl font-black text-blue-700">{clock.day ? getJadwalDayLabel(clock.day) : "Libur"}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">Total kelas</p><p className="mt-1 text-xl font-black">{todaySchedules.length}</p></div>
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button onClick={() => setSelectedDay("SEMUA")} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${selectedDay === "SEMUA" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Semua</button>
        {jadwalDayOptions.map((day) => <button key={day.value} onClick={() => setSelectedDay(day.value)} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${selectedDay === day.value ? "bg-blue-600 text-white" : day.value === clock.day ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}>{day.label}</button>)}
      </nav>

      <div className="space-y-8">
        {grouped.map((group) => (
          <section key={group.value}>
            <div className="mb-3 flex items-center gap-3"><h2 className="text-lg font-black">{group.label}</h2>{group.value === clock.day && <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black text-blue-700">HARI INI</span>}<span className="h-px flex-1 bg-slate-200" /></div>
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
              {group.items.length === 0 ? <p className="p-6 text-sm text-slate-400">Tidak ada kelas.</p> : group.items.map((schedule, index) => {
                const start = timeToMinutes(schedule.startTime);
                const end = schedule.endTime ? timeToMinutes(schedule.endTime) : start + 100;
                const ongoing = group.value === clock.day && clock.minutes >= start && clock.minutes < end;
                const soon = group.value === clock.day && start > clock.minutes && start - clock.minutes <= 60;
                return <article key={schedule.id} className={`grid gap-4 p-5 transition md:grid-cols-[7rem_1fr_auto] md:items-center ${index > 0 ? "border-t border-slate-100" : ""} ${ongoing ? "bg-blue-50" : "hover:bg-slate-50/70"}`}>
                  <div><p className="text-lg font-black text-slate-950">{schedule.startTime}</p><p className="text-xs font-semibold text-slate-400">{schedule.endTime || "Selesai fleksibel"}</p></div>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{schedule.courseCode && <span className="rounded-md bg-slate-950 px-2 py-1 text-[9px] font-black text-white">{schedule.courseCode}</span>}<h3 className="font-black">{schedule.title}</h3>{schedule.sks && <span className="text-[10px] font-bold text-slate-400">{schedule.sks} SKS</span>}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1.5"><FiUser /> {schedule.dosenName || "Dosen belum diisi"}</span>{schedule.location && <span className="inline-flex items-center gap-1.5"><FiMapPin /> {schedule.location}</span>}</div></div>
                  <span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-black ${ongoing ? "bg-blue-600 text-white" : soon ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{ongoing ? "BERLANGSUNG" : soon ? "SEGERA" : "TERJADWAL"}</span>
                </article>;
              })}
            </div>
          </section>
        ))}
      </div>
      {schedules.length === 0 && <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center"><FiBookOpen className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-black">Jadwal belum tersedia</p></div>}
    </div>
  );
}
