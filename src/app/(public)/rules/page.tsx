"use client";

import Link from "next/link";
import { JetBrains_Mono, Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import type { IconType } from "react-icons";
import {
  FiAlertTriangle,
  FiBookOpen,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiCode,
  FiCoffee,
  FiCommand,
  FiCpu,
  FiDatabase,
  FiHome,
  FiMessageCircle,
  FiShield,
  FiTerminal,
  FiUsers,
  FiVolume2,
  FiWifi,
  FiZap,
} from "react-icons/fi";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ruleCards = [
  {
    title: "Disiplin Waktu",
    desc: "Mahasiswa diharapkan datang tepat waktu dan mengikuti kegiatan kelas sesuai jadwal.",
    code: "rule.time = 'on-time';",
    icon: FiClock,
  },
  {
    title: "Jaga Etika Kelas",
    desc: "Gunakan bahasa yang sopan, saling menghargai, dan menjaga suasana kelas tetap nyaman.",
    code: "respect.everyone = true;",
    icon: FiUsers,
  },
  {
    title: "Fokus Saat Pembelajaran",
    desc: "Gunakan laptop atau HP untuk kebutuhan belajar, bukan untuk hal yang mengganggu kelas.",
    code: "focus.mode = 'learning';",
    icon: FiBookOpen,
  },
  {
    title: "Tidak Berisik",
    desc: "Jaga volume suara agar tidak mengganggu dosen maupun teman yang sedang belajar.",
    code: "noise.level <= normal;",
    icon: FiVolume2,
  },
  {
    title: "Aktif dan Bertanggung Jawab",
    desc: "Ikut berpartisipasi dalam diskusi, tugas kelompok, dan kegiatan kelas lainnya.",
    code: "student.active = true;",
    icon: FiZap,
  },
  {
    title: "Jaga Fasilitas",
    desc: "Gunakan fasilitas kelas dan laboratorium dengan baik, terutama perangkat komputer.",
    code: "lab.device.safe();",
    icon: FiCpu,
  },
];

const classProtocols = [
  "Hadir tepat waktu sebelum pembelajaran dimulai.",
  "Mengikuti arahan dosen dan pengurus kelas.",
  "Tidak membuat keributan saat kelas berlangsung.",
  "Mengumpulkan tugas sesuai deadline.",
  "Menjaga kebersihan ruang kelas dan laboratorium.",
  "Menggunakan perangkat teknologi secara bijak.",
];

const digitalEthics = [
  {
    label: "Grup Chat",
    value: "Gunakan grup kelas untuk informasi penting, bukan spam.",
    icon: FiMessageCircle,
  },
  {
    label: "WiFi & Lab",
    value:
      "Gunakan jaringan dan komputer lab hanya untuk kebutuhan pembelajaran.",
    icon: FiWifi,
  },
  {
    label: "Data Kelas",
    value: "Jangan menyebarkan data pribadi teman tanpa izin.",
    icon: FiDatabase,
  },
];

function RelaxNoteCard({
  title = "Catatan Santai",
  text = "Aturan bukan buat bikin kaku, tapi biar kelas tetap nyaman, kompak, dan profesional.",
  Icon = FiCoffee,
  variant = "blue",
}: {
  title?: string;
  text?: string;
  Icon?: IconType;
  variant?: "blue" | "cyan" | "indigo";
}) {
  const variantClass = {
    blue: "from-blue-600 to-cyan-500 shadow-blue-600/25",
    cyan: "from-cyan-500 to-blue-600 shadow-cyan-600/25",
    indigo: "from-indigo-600 to-blue-600 shadow-indigo-600/25",
  }[variant];

  return (
    <div
      className={`group rounded-3xl bg-linear-to-br ${variantClass} p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 transition-all duration-300 group-hover:rotate-6 group-hover:bg-white/20">
          <Icon className="h-6 w-6" />
        </div>

        <div>
          <h3 className="font-black">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-blue-50">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function AturanPage() {

  return (
    <main
      className={`app-page-canvas ${jakarta.className} relative min-h-screen overflow-hidden pt-28`}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-80 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

      <section className="relative container mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/75 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl md:p-8"
          data-aos="fade-down"
        >
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/60 via-white/30 to-blue-100/40" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                <FiShield className="h-4 w-4" />
                Markas TI · Class Rules
              </span>

              <h1
                className={`${orbitron.className} mt-5 text-3xl font-black leading-tight text-slate-950 md:text-5xl`}
              >
                Aturan Kelas Teknik Informatika
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Halaman ini berisi aturan kelas TI2 agar kegiatan perkuliahan
                lebih tertib, nyaman, dan profesional. Dibuat dengan konsep
                seperti sistem protokol kelas yang mudah dipahami.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95"
                >
                  <FiHome className="h-4 w-4" />
                  Kembali Beranda
                  <FiChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/schedules"
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-5 py-3 text-sm font-extrabold text-blue-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <FiClock className="h-4 w-4" />
                  Lihat Jadwal
                </Link>
              </div>
            </div>

            {/* Terminal Card */}
            <div
              className="overflow-hidden rounded-[1.7rem] border border-blue-100 bg-slate-950 shadow-2xl shadow-blue-950/20"
              data-aos="zoom-in-left"
              data-aos-delay="200"
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>

                <p className={`${jetbrains.className} text-xs text-blue-200`}>
                  class-rules.ts
                </p>
              </div>

              <div className={`${jetbrains.className} space-y-2 p-5 text-sm`}>
                <p className="text-blue-300">
                  const kelas = <span className="text-cyan-300">&quot;TI2&quot;</span>;
                </p>
                <p className="text-slate-300">function startClass() {"{"}</p>
                <p className="pl-4 text-green-300">respectEveryone();</p>
                <p className="pl-4 text-green-300">stayFocused();</p>
                <p className="pl-4 text-green-300">keepClean();</p>
                <p className="text-slate-300">{"}"}</p>
                <p className="pt-2 text-yellow-300">status: rules_active ✅</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div
            className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                <FiCheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Status Aturan
                </p>
                <h3 className="text-xl font-black text-slate-950">Aktif</h3>
              </div>
            </div>
          </div>

          <div
            className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl"
            data-aos="fade-up"
            data-aos-delay="180"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-600/20">
                <FiCommand className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Mode Kelas
                </p>
                <h3 className="text-xl font-black text-slate-950">Teratur</h3>
              </div>
            </div>
          </div>

          <div
            className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl"
            data-aos="fade-up"
            data-aos-delay="260"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-600/20">
                <FiAlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Pelanggaran
                </p>
                <h3 className="text-xl font-black text-slate-950">Dihindari</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Rule Cards */}
        <section className="mt-14">
          <div className="mb-8 text-center" data-aos="fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
              <FiCode className="h-4 w-4" />
              Rules Protocol
            </span>

            <h2 className="mt-4 text-2xl font-black text-slate-950 md:text-3xl">
              Aturan Utama Kelas
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Setiap aturan dibuat seperti protokol sederhana agar mudah diingat
              dan diterapkan.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ruleCards.map((rule, index) => {
              const Icon = rule.icon;

              return (
                <article
                  key={rule.title}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 p-6 shadow-lg shadow-blue-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/10"
                  data-aos="zoom-in-up"
                  data-aos-delay={index * 90}
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl transition-all duration-500 group-hover:bg-blue-500/25" />

                  <div className="relative z-10">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-all duration-300 group-hover:rotate-6 group-hover:bg-blue-600 group-hover:text-white">
                      <Icon className="h-7 w-7" />
                    </div>

                    <h3 className="text-lg font-black text-slate-950">
                      {rule.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {rule.desc}
                    </p>

                    <div
                      className={`${jetbrains.className} mt-5 rounded-2xl border border-blue-100 bg-slate-950 px-4 py-3 text-xs font-semibold text-cyan-300`}
                    >
                      {rule.code}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Protocol Checklist + Digital Ethics */}
        <section className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1fr_0.85fr]">
          {/* BOX KIRI */}
          <div
            className="flex h-full flex-col rounded-4xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-blue-900/5 backdrop-blur-xl md:p-8"
            data-aos="fade-right"
          >
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
              <FiCheckCircle className="h-4 w-4" />
              Checklist Kelas
            </span>

            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Protokol Harian Mahasiswa
            </h2>

            <div className="mt-6 space-y-3">
              {classProtocols.map((item, index) => (
                <div
                  key={item}
                  className="group flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20"
                  data-aos="fade-up"
                  data-aos-delay={index * 80}
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-all duration-300 group-hover:bg-white group-hover:text-blue-700">
                    <FiCheckCircle className="h-4 w-4" />
                  </span>

                  <p className="text-sm font-semibold leading-6">{item}</p>
                </div>
              ))}
            </div>

            {/* CATATAN SANTAI KIRI */}
            <div className="mt-auto pt-6">
              <RelaxNoteCard
                title="Quote Santai"
                text="Beda isi kepala, beda alur logika, tapi kita di-compile dalam satu kelas yang sama. Susah senang, error atau running, kita hadapi bareng-bareng."
                Icon={FiTerminal}
                variant="indigo"
              />
            </div>
          </div>

          {/* BOX KANAN */}
          <div
            className="flex h-full flex-col rounded-4xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-blue-900/5 backdrop-blur-xl md:p-8"
            data-aos="fade-left"
          >
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-700">
              <FiWifi className="h-4 w-4" />
              Digital Ethics
            </span>

            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Etika Digital Kelas
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Karena kelas Teknik Informatika dekat dengan teknologi, etika
              digital juga penting untuk dijaga.
            </p>

            <div className="mt-6 space-y-4">
              {digitalEthics.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="group rounded-3xl border border-blue-100 bg-white/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/10"
                    data-aos="zoom-in"
                    data-aos-delay={index * 100}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
                        <Icon className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="font-black text-slate-950">
                          {item.label}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CATATAN SANTAI KANAN */}
            <div className="mt-auto pt-6">
              <RelaxNoteCard
                title="Catatan Santai"
                text="Aturan bukan buat bikin kaku, tapi biar kelas tetap nyaman, kompak, dan profesional."
                Icon={FiCoffee}
                variant="blue"
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
