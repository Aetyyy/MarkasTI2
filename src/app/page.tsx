"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Link from "next/link";
import Image from "next/image";
import SplitText from "@/components/text/splitText";
import TextType from "@/components/text/typingText";
import BlurText from "@/components/text/blurText";

export default function HomePage() {
  useEffect(() => {
    AOS.init({
      once: false,
      duration: 800,
      easing: "ease-out-quart",
    });
  }, []);

  return (
    <main className="pt-16 md:pt-28 bg-rose-50 min-h-screen">
      <section className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center gap-10">
        <div
          className="flex-1 space-y-4"
          data-aos="fade-right"
        >
          <SplitText
            text="Markas TI2 · Program Studi Teknik Informatika"
            className="text-sm font-semibold text-rose-500 uppercase tracking-wide"
            delay={20}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
          />
          <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            <TextType
              text={["Selamat Datang", "Markas TI2"]}
              typingSpeed={160}
              pauseDuration={2000}
              showCursor={true}
              cursorCharacter="|"
            />
          </div>
          <div className="text-slate-600 max-w-xl">
            <BlurText
              text="Markas TI2 adalah pusat informasi santai untuk mahasiswa Teknik Informatika kelas TI2,
            berisi jadwal kuliah, struktur kelas, transkrip, dan informasi penting lain
            yang dibutuhkan selama perkuliahan."
              delay={100}
              animateBy="words"
              direction="top"
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              prefetch={true}
              href="/jadwal"
              className="px-5 py-2.5 rounded-full bg-rose-600 text-white font-semibold text-sm shadow hover:bg-rose-700 transition"
            >
              Jadwal Kuliah
            </Link>
            <Link
              prefetch={true}
              href="/struktur-kelas"
              className="px-5 py-2.5 rounded-full border border-rose-600 text-rose-600 font-semibold text-sm hover:bg-rose-50 transition"
            >
              Struktur Kelas
            </Link>
          </div>
        </div>
        <div
          className="flex-1 w-full"
          data-aos="fade-left"
        >
          <Image alt="" src={"https://placehold.co/600x350"} width={1000} height={1000} onDragStart={(e) => e.preventDefault()} />
        </div>
      </section>

      <section
        className="container mx-auto px-4 pb-16"
        data-aos="fade-up"
      >
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">
          Fitur yang tersedia
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
              Jadwal perkuliahan dan informasi ruang kelas mahasiswa dapat memantau kegiatan perkuliahan dengan mudah.
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
              Aturan
            </h3>
            <p className="text-sm text-slate-700">
              Aturan kelas agar mahasiswa menjadi tertib pada saat di dalam kelas.
            </p>
            <p className="text-xs font-semibold text-rose-400">
              Coming soon
            </p>
          </div>
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Struktur Kelas
            </h3>
            <p className="text-sm text-slate-700">
              Mahasiswa dapat mengetahui seluruh struktur organisasi kelas.
            </p>
            <Link
              href="/jadwal"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat struktur kelas →
            </Link>
          </div>
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Gallery
            </h3>
            <p className="text-sm text-slate-700">
              Mahasiswa dapat menyimpan foto kenangan bersama disini.
            </p>
            <Link
              href="/gallery"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat gallery →
            </Link>
          </div>
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Daftar Mahasiswa
            </h3>
            <p className="text-sm text-slate-700">
              Mahasiswa dapat melihat seluruh daftar
              anggota kelas disini.
            </p>
            <p className="text-xs font-semibold text-rose-400">
              Coming soon
            </p>
          </div>
          <div
            className="bg-white rounded-2xl shadow p-5 space-y-2"
            data-aos="fade-up"
            data-aos-delay="0"
          >
            <h3 className="font-semibold text-rose-600">
              Transkrip Uang Kas
            </h3>
            <p className="text-sm text-slate-700">
              Mahasiswa dapat melihat pengeluaran dan
              pemasukkan uang kas disini.
            </p>
            <Link
              href="/admin/kas-masuk"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Lihat transkrip →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
