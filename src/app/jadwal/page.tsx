"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import { timeToMinutes } from "@/libs/time";

type DayName = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat";
type LecturerStatus = "Hadir" | "Berhalangan";

interface ScheduleSlot {
    id: number;
    start: string;
    end: string;
    subject: string;
    room: string;
    lecturer: string;
    lecturerStatus: LecturerStatus;
}

interface DaySchedule {
    day: DayName;
    slots: ScheduleSlot[];
}

// DATABASE SEMENTARA
const TEMP_SCHEDULE: DaySchedule[] = [
    {
        day: "Senin",
        slots: [
            {
                id: 1,
                start: "08:00",
                end: "09:40",
                subject: "Pemrograman Web Lanjut",
                room: "Lab 1",
                lecturer: "Bapak Andi, S.T., M.T.",
                lecturerStatus: "Hadir",
            },
            {
                id: 2,
                start: "10:00",
                end: "11:40",
                subject: "Struktur Data",
                room: "Ruang 203",
                lecturer: "Ibu Rina, S.Kom., M.Kom.",
                lecturerStatus: "Hadir",
            },
        ],
    },
    {
        day: "Selasa",
        slots: [
            {
                id: 3,
                start: "08:00",
                end: "09:40",
                subject: "Basis Data",
                room: "Ruang 101",
                lecturer: "Bapak Budi, S.Kom., M.Kom.",
                lecturerStatus: "Berhalangan", // contoh dosen berhalangan
            },
            {
                id: 4,
                start: "13:00",
                end: "14:40",
                subject: "Jaringan Komputer",
                room: "Lab Jaringan",
                lecturer: "Bapak Hendra, S.T., M.T.",
                lecturerStatus: "Hadir",
            },
        ],
    },
    {
        day: "Rabu",
        slots: [
            {
                id: 5,
                start: "09:00",
                end: "11:40",
                subject: "Kecerdasan Buatan",
                room: "Ruang 305",
                lecturer: "Ibu Sari, S.Kom., M.T.",
                lecturerStatus: "Hadir",
            },
        ],
    },
    {
        day: "Kamis",
        slots: [
            {
                id: 6,
                start: "08:00",
                end: "09:40",
                subject: "Sistem Operasi",
                room: "Ruang 202",
                lecturer: "Bapak Yoga, S.T., M.Kom.",
                lecturerStatus: "Hadir",
            },
            {
                id: 7,
                start: "10:00",
                end: "11:40",
                subject: "Interaksi Manusia dan Komputer",
                room: "Ruang 204",
                lecturer: "Ibu Dina, S.Kom., M.Kom.",
                lecturerStatus: "Hadir",
            },
        ],
    },
    {
        day: "Jumat",
        slots: [
            {
                id: 8,
                start: "08:00",
                end: "09:40",
                subject: "Perakitan Bomb",
                room: "Ruang 201",
                lecturer: "Bapak Rudi, S.Kom., M.Pd.",
                lecturerStatus: "Hadir",
            },
        ],
    },
];

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
            return null; // Sabtu/Minggu tidak ada jadwal
    }
}

type SlotState = "past" | "ongoing" | "upcoming";

function getSlotState(
    slot: ScheduleSlot,
    isToday: boolean,
    nowMinutes: number
): SlotState {
    if (!isToday) return "upcoming";

    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);

    if (nowMinutes >= start && nowMinutes < end) {
        return "ongoing";
    }
    if (nowMinutes >= end) {
        return "past";
    }
    return "upcoming";
}

export default function JadwalPage() {
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

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const todayName = getTodayName();

    const days: (DayName | "Semua")[] = [
        "Semua",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
    ];

    const filteredSchedule =
        selectedDay === "Semua"
            ? TEMP_SCHEDULE
            : TEMP_SCHEDULE.filter((d) => d.day === selectedDay);

    return (
        <main className="pt-28 bg-rose-50 min-h-screen">
            <section
                className="container mx-auto px-4 py-8 space-y-6"
                data-aos="fade-in"
            >
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div data-aos="fade-right">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                            Jadwal Perkuliahan
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Halaman ini menampilkan jadwal mata kuliah untuk kelas Teknik
                            Informatika. Blok yang sedang berjalan akan diberi warna
                            berbeda secara otomatis. Jika dosen berhalangan, kelas tidak
                            berlangsung dan mahasiswa diminta menunggu informasi lanjutan.
                        </p>
                        {todayName && (
                            <p
                                className="text-xs text-slate-500 mt-1"
                                data-aos="fade-up"
                                data-aos-delay="150"
                            >
                                Hari ini: <span className="font-semibold">{todayName}</span>{" "}
                                • Waktu sekarang:{" "}
                                {now.toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        )}
                    </div>

                    <div
                        className="flex flex-wrap gap-2"
                        data-aos="zoom-in"
                        data-aos-delay="200"
                    >
                        {days.map((day, index) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => setSelectedDay(day)}
                                className={`px-3 py-1.5 rounded-full text-xs md:text-sm border transition ${selectedDay === day
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

                {/* JADWAL */}
                <div
                    className="space-y-6"
                    data-aos="fade-up"
                    data-aos-delay="150"
                >
                    {filteredSchedule.length === 0 && (
                        <p className="text-sm text-slate-500">
                            Tidak ada jadwal untuk hari yang dipilih.
                        </p>
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
                                        const state = getSlotState(
                                            slot,
                                            isToday,
                                            nowMinutes
                                        );

                                        let cardClass =
                                            "border rounded-xl p-3 md:p-4 text-sm transition-colors";
                                        let badgeText = "";
                                        let badgeClass =
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold";

                                        // Dosen berhalangan
                                        if (slot.lecturerStatus === "Berhalangan") {
                                            cardClass +=
                                                " bg-slate-100 text-slate-600 border-slate-300";
                                            badgeText = "Dosen berhalangan";
                                            badgeClass += " bg-slate-300 text-slate-700";
                                        } else {
                                            // Dosen hadir
                                            if (state === "ongoing") {
                                                cardClass +=
                                                    " bg-rose-600 text-white border-rose-600 shadow-lg";
                                                badgeText = "Sedang berlangsung";
                                                badgeClass += " bg-white/20 text-white";
                                            } else if (state === "past") {
                                                cardClass +=
                                                    " bg-slate-100 text-slate-500 border-slate-200";
                                                badgeText = "Selesai";
                                                badgeClass += " bg-slate-200 text-slate-600";
                                            } else {
                                                // upcoming
                                                cardClass +=
                                                    " bg-white text-slate-800 border-slate-200 hover:border-rose-300 hover:bg-rose-50";
                                                badgeText = "Belum mulai";
                                                badgeClass += " bg-rose-100 text-rose-700";
                                            }
                                        }

                                        return (
                                            <div
                                                key={slot.id}
                                                className={cardClass}
                                                data-aos="zoom-in-up"
                                                data-aos-delay={200 + slotIndex * 120}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <h3 className="font-semibold text-sm md:text-base">
                                                        {slot.subject}
                                                    </h3>
                                                    <span className={badgeClass}>{badgeText}</span>
                                                </div>
                                                <p className="text-xs md:text-sm">
                                                    <span className="font-semibold">Waktu:</span>{" "}
                                                    {slot.start} – {slot.end}
                                                </p>
                                                <p className="text-xs md:text-sm">
                                                    <span className="font-semibold">Ruang:</span>{" "}
                                                    {slot.room}
                                                </p>
                                                <p className="text-xs md:text-sm">
                                                    <span className="font-semibold">Dosen:</span>{" "}
                                                    {slot.lecturer}
                                                </p>
                                                <p className="text-xs md:text-sm">
                                                    <span className="font-semibold">Status Dosen:</span>{" "}
                                                    {slot.lecturerStatus === "Hadir"
                                                        ? "Hadir"
                                                        : "Berhalangan"}
                                                </p>

                                                {slot.lecturerStatus === "Berhalangan" && (
                                                    <p className="mt-1 text-[11px] md:text-xs italic">
                                                        Kelas tidak berlangsung. Harap menunggu informasi
                                                        lebih lanjut dari dosen atau pengelola kelas.
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
                    <span>
                        Data pada halaman ini masih menggunakan{" "}
                        <span className="font-semibold">database sementara</span>.
                    </span>
                    <Link
                        href="/"
                        className="text-rose-600 hover:underline font-semibold"
                    >
                        Kembali ke beranda
                    </Link>
                </div>
            </section>
        </main>
    );
}
