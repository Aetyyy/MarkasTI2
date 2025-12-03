"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import { timeToMinutes } from "@/libs/time";
import type { Jadwal } from "@/libs/types";

type DayName = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat";

interface ScheduleSlot extends Jadwal {
  day: DayName;
}

function getDayFromDate(dateStr: string): DayName | null {
  const date = new Date(dateStr);
  const day = date.getDay();
  switch (day) {
    case 1:
      return "Senin";
    case 2:
      return "Selasa";
    case 3:
      return "Rabu";
    case 4:
      return "Kamis";
    case 5:
      return "Jumat";
    default:
      return null;
  }
}

function getTodayName(): DayName | null {
  const day = new Date().getDay();
  switch (day) {
    case 1:
      return "Senin";
    case 2:
      return "Selasa";
    case 3:
      return "Rabu";
    case 4:
      return "Kamis";
    case 5:
      return "Jumat";
    default:
      return null;
  }
}

type SlotState = "past" | "ongoing" | "upcoming";

function getSlotState(time: string | undefined, isToday: boolean, nowMinutes: number): SlotState {
  if (!time || !isToday) return "upcoming";

  const start = timeToMinutes(time);
  const end = start + 100; // Default 1 jam 40 menit

  if (nowMinutes >= start && nowMinutes < end) {
    return "ongoing";
  }
  if (nowMinutes >= end) {
    return "past";
  }
  return "upcoming";
}

export default function JadwalPage() {
  const [jadwal, setJadwal] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayName | "Semua">("Semua");

  useEffect(() => {
    AOS.init({
      once: false,
      duration: 800,
      easing: "ease-out-quart",
    });

    const interval = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/jadwal");
        const data = await res.json();

        const withDays: ScheduleSlot[] = (data.data || []).map((item: Jadwal) => ({
          ...item,
          day: getDayFromDate(item.date) as DayName,
        }));

        setJadwal(withDays);
      } catch (error) {
        console.error("Failed to fetch jadwal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJadwal();
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayName = getTodayName();

  const days: (DayName | "Semua")[] = ["Semua", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  const groupedByDay = jadwal.reduce((acc, slot) => {
    if (!slot.day) return acc;
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {} as Record<DayName, ScheduleSlot[]>);

  const filteredSchedule =
    selectedDay === "Semua"
      ? Object.entries(groupedByDay).map(([day, slots]) => ({ day: day as DayName, slots }))
      : groupedByDay[selectedDay]
        ? [{ day: selectedDay, slots: groupedByDay[selectedDay] }]
        : [];

  if (loading)
    return (
      <main className="pt-16 md:pt-28 bg-rose-50 min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading jadwal...</p>
      </main>
    );

  return (
    <main className="pt-16 md:pt-28 bg-rose-50 min-h-screen">
      <section className="container mx-auto px-4 py-8 space-y-6" data-aos="fade-in">
        <div className="flex flex-col gap-4">
          <div data-aos="fade-right">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Jadwal Perkuliahan</h1>
            <p className="text-sm text-slate-600 mt-1">
              Halaman ini menampilkan jadwal mata kuliah untuk kelas Teknik Informatika.
            </p>
            {todayName && (
              <p
                className="text-xs text-slate-500 mt-1"
                data-aos="fade-up"
                data-aos-delay="150"
              >
                Hari ini: <span className="font-semibold">{todayName}</span> • Waktu sekarang:{" "}
                {now.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2" data-aos="zoom-in" data-aos-delay="200">
            {days.map((day, index) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-full text-xs md:text-sm border transition cursor-pointer ${
                  selectedDay === day
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50"
                }`}
                data-aos="zoom-in-up"
                data-aos-delay={200 + index * 70}
              >
                {day === "Semua" ? "Semua Hari" : day}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-6" data-aos="fade-up" data-aos-delay="150">
          {filteredSchedule.length === 0 && (
            <p className="text-sm text-slate-500">Tidak ada jadwal untuk hari yang dipilih.</p>
          )}

          {filteredSchedule.map((daySchedule, dayIndex) => {
            const isToday = todayName === daySchedule.day;

            return (
              <div
                key={daySchedule.day}
                className="space-y-3"
                data-aos="fade-up"
                data-aos-delay={100 + dayIndex * 150}
              >
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  {daySchedule.day}
                  {isToday && (
                    <span
                      className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700"
                      data-aos="zoom-in"
                      data-aos-delay={150 + dayIndex * 150}
                    >
                      Hari ini
                    </span>
                  )}
                </h2>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {daySchedule.slots.map((slot, slotIndex) => {
                    const state = getSlotState(slot.time, isToday, nowMinutes);

                    let cardClass =
                      "border rounded-xl p-3 md:p-4 text-sm transition-colors";
                    let badgeText = "";
                    let badgeClass =
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold";

                    if (state === "ongoing") {
                      cardClass += " bg-rose-600 text-white border-rose-600 shadow-lg";
                      badgeText = "Sedang berlangsung";
                      badgeClass += " bg-white/20 text-white";
                    } else if (state === "past") {
                      cardClass += " bg-slate-100 text-slate-500 border-slate-200";
                      badgeText = "Selesai";
                      badgeClass += " bg-slate-200 text-slate-600";
                    } else {
                      cardClass +=
                        " bg-white text-slate-800 border-slate-200 hover:border-rose-300 hover:bg-rose-50";
                      badgeText = "Belum mulai";
                      badgeClass += " bg-rose-100 text-rose-700";
                    }

                    return (
                      <div
                        key={slot.id}
                        className={cardClass}
                        data-aos="zoom-in-up"
                        data-aos-delay={200 + slotIndex * 120}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h3 className="font-semibold text-sm md:text-base">{slot.title}</h3>
                          <span className={badgeClass}>{badgeText}</span>
                        </div>
                        {slot.time && (
                          <p className="text-xs md:text-sm">
                            <span className="font-semibold">Waktu:</span> {slot.time}
                          </p>
                        )}
                        {slot.description && (
                          <p className="text-xs md:text-sm">
                            <span className="font-semibold">Deskripsi:</span> {slot.description}
                          </p>
                        )}
                        {slot.location && (
                          <p className="text-xs md:text-sm">
                            <span className="font-semibold">Lokasi:</span> {slot.location}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mb-6 pt-4 border-t border-rose-100 mt-6 flex justify-between items-center text-xs text-slate-500"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <span>Data jadwal dari database backend</span>
          <Link href="/" className="text-rose-600 hover:underline font-semibold">
            Kembali ke beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
