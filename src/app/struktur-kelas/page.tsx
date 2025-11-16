"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

type Division = {
    id: string;
    role: string;
    name: string;
    description?: string;
    members: string[];
};

const KETUA = {
    role: "Ketua Kelas (KM)",
    name: "Nama Ketua Kelas",
    description:
        "Koordinator utama kelas, penghubung dengan dosen, dan penanggung jawab kegiatan kelas.",
};

const DIVISIONS: Division[] = [
    {
        id: "wakil",
        role: "Wakil Ketua",
        name: "Nama Wakil Ketua",
        description:
            "Mendampingi ketua kelas dan memastikan koordinasi berjalan ketika ketua berhalangan.",
        members: ["Koordinator Akademik", "Koordinator Komunikasi"],
    },
    {
        id: "sekretaris",
        role: "Sekretaris",
        name: "Nama Sekretaris",
        description:
            "Mengurus administrasi kelas seperti notulen rapat, daftar hadir, dan pengarsipan dokumen.",
        members: ["Notulis / Dokumentasi", "Pengelola Informasi Kelas"],
    },
    {
        id: "bendahara",
        role: "Bendahara",
        name: "Nama Bendahara",
        description:
            "Mengelola keuangan kelas, iuran, dana kegiatan, dan pelaporan penggunaan dana.",
        members: ["Pengelola Iuran", "Pengelola Dana Kegiatan"],
    },
];

export default function StrukturKelasPage() {
    useEffect(() => {
        AOS.init({
            once: true,
            duration: 700,
            easing: "ease-out-quart",
        });
    }, []);

    return (
        <main className="pt-28 bg-rose-50 min-h-screen">
            <section className="container mx-auto px-4 py-10">
                <header
                    className="text-center max-w-2xl mx-auto space-y-2"
                    data-aos="fade-down"
                >
                    <p className="text-sm font-semibold text-rose-500 uppercase tracking-wide">
                        Markas TI · Struktur Kelas
                    </p>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        Struktur Organisasi Kelas
                    </h1>
                    <p className="text-sm md:text-base text-slate-600">
                        Susunan pengurus kelas Teknik Informatika, mulai dari Ketua Kelas
                        hingga koordinator masing-masing bidang.
                    </p>
                </header>

                <div className="mt-10 flex flex-col items-center">
                    <div
                        className="bg-white/90 border border-rose-100 shadow-sm rounded-2xl px-6 py-4 max-w-xs text-center"
                        data-aos="zoom-in"
                    >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {KETUA.role}
                        </p>
                        <p className="mt-1 text-base md:text-lg font-semibold text-slate-900">
                            {KETUA.name}
                        </p>
                        <p className="mt-2 text-xs md:text-sm text-slate-600">
                            {KETUA.description}
                        </p>
                    </div>

                    <div
                        className="h-8 w-px bg-slate-300 mt-1"
                        data-aos="fade-down"
                        data-aos-delay="150"
                    />

                    <div
                        className="relative w-full max-w-5xl mt-2"
                        data-aos="fade-up"
                        data-aos-delay="150"
                    >
                        <div className="hidden md:block absolute left-[10%] right-[10%] top-0 h-px bg-slate-300" />
                        <div className="flex flex-col gap-10 pt-4 md:flex-row md:justify-between">
                            {DIVISIONS.map((division, idx) => (
                                <div
                                    key={division.id}
                                    className="flex flex-col items-center flex-1 min-w-[210px]"
                                    data-aos="fade-up"
                                    data-aos-delay={200 + idx * 120}
                                >
                                    <div className="hidden md:block w-px h-4 bg-slate-300" />
                                    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm px-4 py-3 w-full max-w-xs text-center hover:-translate-y-1 hover:shadow-md transition">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                                            {division.role}
                                        </p>
                                        <p className="mt-1 text-sm md:text-base font-semibold text-slate-900">
                                            {division.name}
                                        </p>
                                        {division.description && (
                                            <p className="mt-2 text-xs text-slate-600">
                                                {division.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-px h-6 bg-slate-300 mt-2" />
                                    <div className="flex flex-col items-center w-full mt-2">
                                        {division.members.length > 1 && (
                                            <div className="hidden sm:block w-[80%] h-px bg-slate-200" />
                                        )}

                                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-center w-full max-w-xs">
                                            {division.members.map((member, memberIdx) => (
                                                <div
                                                    key={memberIdx}
                                                    className="bg-white rounded-xl border border-slate-100 shadow-sm px-3 py-2 text-center flex-1 hover:border-rose-300 transition"
                                                    data-aos="zoom-in-up"
                                                    data-aos-delay={260 + memberIdx * 100}
                                                >
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                        Anggota
                                                    </p>
                                                    <p className="mt-1 text-xs md:text-sm text-slate-800">
                                                        {member}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p
                        className="mt-8 text-[11px] md:text-xs text-slate-500 text-center max-w-xl"
                        data-aos="fade-up"
                        data-aos-delay="300"
                    >
                        *Nama jabatan dan anggota di atas masih sebagai contoh.
                    </p>
                </div>
            </section>
        </main>
    );
}
