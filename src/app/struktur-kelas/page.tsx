"use client";

import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import type { StrukturKelas } from "@/libs/types";

export default function StrukturKelasPage() {
  const [struktur, setStruktur] = useState<StrukturKelas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({
      once: true,
      duration: 700,
      easing: "ease-out-quart",
    });

    const fetchStruktur = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/struktur");
        const data = await res.json();
        setStruktur(data.data || []);
      } catch (error) {
        console.error("Failed to fetch struktur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStruktur();
  }, []);

  if (loading)
    return (
      <main className="pt-28 bg-rose-50 min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading struktur kelas...</p>
      </main>
    );

  // Group by role
  const ketua = struktur.find((s) => s.role?.toLowerCase().includes("ketua") && !s.role?.toLowerCase().includes("wakil"));
  const wakil = struktur.find((s) => s.role?.toLowerCase().includes("wakil"));
  const sekretaris = struktur.find((s) => s.role?.toLowerCase().includes("sekretaris"));
  const bendahara = struktur.find((s) => s.role?.toLowerCase().includes("bendahara"));

  const positions = [
    { role: "Wakil Ketua", member: wakil },
    { role: "Sekretaris", member: sekretaris },
    { role: "Bendahara", member: bendahara },
  ].filter((item) => item.member);

  return (
    <main className="pt-28 bg-rose-50 min-h-screen">
      <section className="container mx-auto px-4 py-10">
        <header className="text-center max-w-2xl mx-auto space-y-2" data-aos="fade-down">
          <p className="text-sm font-semibold text-rose-500 uppercase tracking-wide">
            Markas TI · Struktur Kelas
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Struktur Organisasi Kelas
          </h1>
          <p className="text-sm md:text-base text-slate-600">
            Susunan pengurus kelas Teknik Informatika.
          </p>
        </header>

        <div className="mt-10 flex flex-col items-center">
          {ketua ? (
            <div className="bg-white/90 border border-rose-100 shadow-sm rounded-2xl px-6 py-4 max-w-xs text-center" data-aos="zoom-in">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {ketua.role}
              </p>
              <p className="mt-1 text-base md:text-lg font-semibold text-slate-900">
                {ketua.name}
              </p>
              {ketua.contact && (
                <p className="mt-1 text-xs text-slate-500">{ketua.contact}</p>
              )}
            </div>
          ) : (
            <div className="bg-white/90 border border-slate-200 shadow-sm rounded-2xl px-6 py-4 max-w-xs text-center" data-aos="zoom-in">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ketua Kelas
              </p>
              <p className="mt-1 text-base md:text-lg font-semibold text-slate-400">
                Belum ditentukan
              </p>
            </div>
          )}

          <div className="h-8 w-px bg-slate-300 mt-1" data-aos="fade-down" data-aos-delay="150" />

          <div className="relative w-full max-w-5xl mt-2" data-aos="fade-up" data-aos-delay="150">
            <div className="hidden md:block absolute left-[10%] right-[10%] top-0 h-px bg-slate-300" />
            <div className="flex flex-col gap-10 pt-4 md:flex-row md:justify-between">
              {positions.map((position, idx) => (
                <div
                  key={position.role}
                  className="flex flex-col items-center flex-1 min-w-[210px]"
                  data-aos="fade-up"
                  data-aos-delay={200 + idx * 120}
                >
                  <div className="hidden md:block w-px h-4 bg-slate-300" />
                  <div className="bg-white rounded-2xl border border-rose-100 shadow-sm px-4 py-3 w-full max-w-xs text-center hover:-translate-y-1 hover:shadow-md transition">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                      {position.role}
                    </p>
                    <p className="mt-1 text-sm md:text-base font-semibold text-slate-900">
                      {position.member?.name || "Belum ditentukan"}
                    </p>
                    {position.member?.contact && (
                      <p className="mt-1 text-xs text-slate-600">{position.member.contact}</p>
                    )}
                  </div>

                  <div className="w-px h-6 bg-slate-300 mt-2" />
                </div>
              ))}
            </div>
          </div>

          {struktur.length === 0 && (
            <p className="mt-8 text-[11px] md:text-xs text-slate-500 text-center max-w-xl" data-aos="fade-up" data-aos-delay="300">
              *Data struktur kelas masih kosong.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
