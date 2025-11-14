"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Link from "next/link";


export default function HomePage() {
  useEffect(() => {
    AOS.init({
      once: false,
      duration: 800,
      easing: "ease-out-quart",
    });
  }, []);

  return (
    <main className="pt-28 bg-rose-50 min-h-screen">
      <section className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center gap-10">
        <div
          className="flex-1 space-y-4"
          data-aos="fade-right"
        >
          <p className="text-sm font-semibold text-rose-500 uppercase tracking-wide">
            Markas TI2 · Program Studi Teknik Informatika
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            Markas {" "}
            <span className="text-rose-600">TI2</span>
          </h1>
          <p className="text-slate-600 max-w-xl">
            Markas TI2 adalah pusat informasi santai untuk mahasiswa Teknik Informatika kelas TI2,
            berisi jadwal kuliah, struktur kelas, silabus, dan informasi penting lain
            yang dibutuhkan selama perkuliahan.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/jadwal"
              className="px-5 py-2.5 rounded-full bg-rose-600 text-white font-semibold text-sm shadow hover:bg-rose-700 transition"
            >
              Lihat Jadwal Kuliah
            </Link>
            <Link
              href="/struktur-kelas"
              className="px-5 py-2.5 rounded-full border border-rose-600 text-rose-600 font-semibold text-sm hover:bg-rose-50 transition"
            >
              Lihat Struktur Kelas
            </Link>
          </div>
        </div>

        <div
          className="flex-1 w-full"
          data-aos="fade-left"
        >
          <div className="bg-white rounded-3xl shadow-xl p-5 md:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Informasi Singkat Mata Kuliah
            </h2>
            <ul className="text-sm text-slate-700 space-y-2">
              <li>
                <span className="font-semibold">Kode Mata Kuliah:</span> IF-XXXX
              </li>
              <li>
                <span className="font-semibold">Nama Mata Kuliah:</span> Contoh – Pemrograman Web Lanjut
              </li>
              <li>
                <span className="font-semibold">Dosen Pengampu:</span> Nama Dosen, S.T., M.T.
              </li>
              <li>
                <span className="font-semibold">Kelas:</span> TI A / TI B
              </li>
              <li>
                <span className="font-semibold">Tahun Ajaran:</span> 2024/2025
              </li>
            </ul>
            <p className="text-xs text-slate-500">
              *Data sementara
            </p>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section
        className="container mx-auto px-4 pb-16"
        data-aos="fade-up"
      >
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">
          Fitur yang tersedia di markas kelas
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Jadwal & Ruang Kelas
            </h3>
            <p className="text-sm text-slate-700">
              Menyajikan jadwal perkuliahan dan informasi ruang kelas
              sehingga mahasiswa dapat memantau kegiatan perkuliahan dengan mudah.
            </p>
            <Link
              href="/jadwal"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat jadwal →
            </Link>
          </div>
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Jadwal & Ruang Kelas
            </h3>
            <p className="text-sm text-slate-700">
              Menyajikan jadwal perkuliahan dan informasi ruang kelas
              sehingga mahasiswa dapat memantau kegiatan perkuliahan dengan mudah.
            </p>
            <Link
              href="/jadwal"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat jadwal →
            </Link>
          </div>
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Jadwal & Ruang Kelas
            </h3>
            <p className="text-sm text-slate-700">
              Menyajikan jadwal perkuliahan dan informasi ruang kelas
              sehingga mahasiswa dapat memantau kegiatan perkuliahan dengan mudah.
            </p>
            <Link
              href="/jadwal"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat jadwal →
            </Link>
          </div>
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Jadwal & Ruang Kelas
            </h3>
            <p className="text-sm text-slate-700">
              Menyajikan jadwal perkuliahan dan informasi ruang kelas
              sehingga mahasiswa dapat memantau kegiatan perkuliahan dengan mudah.
            </p>
            <Link
              href="/jadwal"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat jadwal →
            </Link>
          </div>
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Jadwal & Ruang Kelas
            </h3>
            <p className="text-sm text-slate-700">
              Menyajikan jadwal perkuliahan dan informasi ruang kelas
              sehingga mahasiswa dapat memantau kegiatan perkuliahan dengan mudah.
            </p>
            <Link
              href="/jadwal"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat jadwal →
            </Link>
          </div>
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Jadwal & Ruang Kelas
            </h3>
            <p className="text-sm text-slate-700">
              Menyajikan jadwal perkuliahan dan informasi ruang kelas
              sehingga mahasiswa dapat memantau kegiatan perkuliahan dengan mudah.
            </p>
            <Link
              href="/jadwal"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat jadwal →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
