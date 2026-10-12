import Link from "next/link";
import { Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import type { IconType } from "react-icons";
import {
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiGitCommit,
  FiFileText,
  FiGrid,
  FiMapPin,
  FiStar,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import SplitText from "@/components/text/splitText";
import TextType from "@/components/text/typingText";
import BlurText from "@/components/text/blurText";
import { getPublicSchedules } from "@/libs/schedules/query";
import type {
  JadwalDayValue,
  ScheduleForClient,
} from "@/types/scheduleManagement";
import { getJadwalDayLabel } from "@/types/scheduleManagement";
import { getPublicChangelogs } from "@/libs/changelogs/query";
import type { ChangelogForClient, ChangelogType } from "@/types/changelog";

export const dynamic = "force-dynamic";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

type FeatureCardProps = {
  title: string;
  desc: string;
  href: string;
  Icon: IconType;
  delay?: number;
};

type StatCardProps = {
  title: string;
  value: string;
  desc: string;
  Icon: IconType;
  delay?: number;
};

const features: FeatureCardProps[] = [
  {
    title: "Jadwal & Ruang Kelas",
    desc: "Pantau jadwal perkuliahan, jam kelas, dan lokasi ruangan dengan tampilan yang mudah dibaca.",
    href: "/schedules",
    Icon: FiCalendar,
    delay: 0,
  },
  {
    title: "Aturan Kelas",
    desc: "Berisi aturan kelas agar kegiatan perkuliahan tetap tertib, rapi, dan nyaman untuk semua anggota.",
    href: "/rules",
    Icon: FiFileText,
    delay: 100,
  },
  {
    title: "Struktur Kelas",
    desc: "Lihat susunan organisasi kelas seperti ketua kelas, sekretaris, bendahara, dan bagian lainnya.",
    href: "/struktur-kelas",
    Icon: FiUsers,
    delay: 200,
  },
  {
    title: "Gallery",
    desc: "Tempat menyimpan foto kenangan, dokumentasi kelas, dan momen penting selama perkuliahan.",
    href: "/gallery",
    Icon: FiCamera,
    delay: 300,
  },
  {
    title: "Daftar Mahasiswa",
    desc: "Lihat daftar anggota kelas Teknik Informatika secara lebih rapi dan terstruktur.",
    href: "/teams",
    Icon: FiBookOpen,
    delay: 400,
  },
  {
    title: "Transkrip Uang Kas",
    desc: "Pantau pemasukan, pengeluaran, dan riwayat uang kas kelas secara transparan.",
    href: "/transkrip-kas",
    Icon: FiCreditCard,
    delay: 500,
  },
];

function timeToMinutes(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}

function getTodayDay(): JadwalDayValue | null {
  const day = new Date().getDay();

  if (day === 1) return "SENIN";
  if (day === 2) return "SELASA";
  if (day === 3) return "RABU";
  if (day === 4) return "KAMIS";
  if (day === 5) return "JUMAT";
  if (day === 6) return "SABTU";

  return null;
}

function getTodaySchedules(schedules: ScheduleForClient[]) {
  const todayDay = getTodayDay();

  if (!todayDay) return [];

  return schedules.filter((schedule) => schedule.day === todayDay);
}

function getOngoingSchedule(schedules: ScheduleForClient[]) {
  const todayDay = getTodayDay();

  if (!todayDay) return null;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    schedules.find((schedule) => {
      if (schedule.day !== todayDay) return false;

      const start = timeToMinutes(schedule.startTime);
      const end = schedule.endTime
        ? timeToMinutes(schedule.endTime)
        : start + 100;

      return nowMinutes >= start && nowMinutes < end;
    }) ?? null
  );
}

function FeatureCard({ title, desc, href, Icon, delay = 0 }: FeatureCardProps) {
  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-6 shadow-lg shadow-blue-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/10"
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl transition-all duration-500 group-hover:bg-blue-500/25" />
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 group-hover:w-full" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm transition-all duration-300 group-hover:rotate-6 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/25">
          <Icon className="h-7 w-7" />
        </div>

        <h3 className="mb-2 text-lg font-extrabold text-slate-900">{title}</h3>

        <p className="mb-5 grow text-sm leading-6 text-slate-600">{desc}</p>

        <Link
          href={href}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 transition-all duration-300 hover:bg-blue-600 hover:text-white"
        >
          Akses Sekarang
          <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

function StatCard({ title, value, desc, Icon, delay = 0 }: StatCardProps) {
  return (
    <div
      className="group rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-900/10"
      data-aos="zoom-in-up"
      data-aos-delay={delay}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 group-hover:scale-110">
          <Icon className="h-7 w-7" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="text-2xl font-black text-slate-950">{value}</h3>
          <p className="text-xs font-medium text-blue-700">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function OngoingScheduleCard({
  ongoingSchedule,
}: {
  ongoingSchedule: ScheduleForClient | null;
}) {
  if (!ongoingSchedule) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <FiClock className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900">
              Tidak ada jadwal aktif
            </p>
            <p className="text-xs text-slate-500">
              Saat ini belum ada kelas yang sedang berlangsung.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/schedules"
      className="group block rounded-2xl border border-blue-100 bg-blue-50/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-lg hover:shadow-blue-900/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <FiCheckCircle className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Sedang Berlangsung
            </p>

            <p className="mt-1 line-clamp-1 text-sm font-extrabold text-slate-900">
              {ongoingSchedule.title}
            </p>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                <FiClock className="h-3.5 w-3.5 text-blue-600" />
                {ongoingSchedule.startTime}
                {ongoingSchedule.endTime ? ` - ${ongoingSchedule.endTime}` : ""}
              </span>

              {ongoingSchedule.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                  <FiMapPin className="h-3.5 w-3.5 text-blue-600" />
                  {ongoingSchedule.location}
                </span>
              )}
            </div>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-md shadow-blue-600/20">
          Live
        </span>
      </div>
    </Link>
  );
}

function DashboardPreview({
  schedules,
  todaySchedules,
  ongoingSchedule,
}: {
  schedules: ScheduleForClient[];
  todaySchedules: ScheduleForClient[];
  ongoingSchedule: ScheduleForClient | null;
}) {
  const todayDay = getTodayDay();

  return (
    <div className="relative" data-aos="fade-left" data-aos-delay="150">
      <div className="landing-preview relative overflow-hidden rounded-[2rem] border p-4 sm:p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Dashboard MarkasTI
            </p>
            <p className="text-xs font-medium text-slate-500">
              Data ringkasan dari backend
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-400" />
            <span className="h-3 w-3 rounded-full bg-cyan-400" />
            <span className="h-3 w-3 rounded-full bg-indigo-400" />
          </div>
        </div>

        <div className="landing-highlight rounded-3xl p-5 text-white shadow-lg shadow-blue-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                Kelas Aktif
              </p>

              <h2 className={`${orbitron.className} mt-2 text-4xl font-black`}>
                TI2
              </h2>

              <p className="mt-2 text-sm font-semibold text-blue-100">
                {todayDay
                  ? `${getJadwalDayLabel(todayDay)} · ${todaySchedules.length} jadwal hari ini`
                  : "Akhir pekan · tidak ada jadwal kelas"}
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
              <FiTrendingUp className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:mt-8">
            <Link
              href="/schedules"
              className="rounded-2xl bg-white/15 p-3 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              <FiCalendar className="mb-2 h-5 w-5" />
              <p className="text-[11px] font-semibold text-blue-100">Jadwal</p>
              <p className="mt-1 text-xl font-black">{schedules.length}</p>
            </Link>

            <Link
              href="/struktur-kelas"
              className="rounded-2xl bg-white/15 p-3 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              <FiUsers className="mb-2 h-5 w-5" />
              <p className="text-[11px] font-semibold text-blue-100">
                Struktur
              </p>
              <p className="mt-1 text-xl font-black">TI2</p>
            </Link>

            <Link
              href="/gallery"
              className="rounded-2xl bg-white/15 p-3 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              <FiCamera className="mb-2 h-5 w-5" />
              <p className="text-[11px] font-semibold text-blue-100">Gallery</p>
              <p className="mt-1 text-xl font-black">View</p>
            </Link>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <OngoingScheduleCard ongoingSchedule={ongoingSchedule} />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs font-semibold text-slate-500">
                Jadwal Aktif
              </p>
              <p className="mt-1 text-sm font-black text-blue-700">
                {schedules.length} data
              </p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs font-semibold text-slate-500">Hari Ini</p>
              <p className="mt-1 text-sm font-black text-blue-700">
                {todaySchedules.length} jadwal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileQuickActions() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:hidden"
      data-aos="fade-up"
      data-aos-delay="200"
    >
      <Link
        prefetch={true}
        href="/schedules"
        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 active:scale-95"
      >
        <FiCalendar className="h-5 w-5" />
        Jadwal
        <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>

      <Link
        prefetch={true}
        href="/struktur-kelas"
        className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white/80 px-4 py-3 text-sm font-extrabold text-blue-700 shadow-sm backdrop-blur-md transition-all duration-300 active:scale-95"
      >
        <FiUsers className="h-5 w-5" />
        Struktur
      </Link>
    </div>
  );
}

const changelogStyle: Record<
  ChangelogType,
  { label: string; badge: string; dot: string }
> = {
  FEATURE: {
    label: "Fitur Baru",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-600 ring-blue-100",
  },
  IMPROVEMENT: {
    label: "Peningkatan",
    badge: "bg-cyan-100 text-cyan-700",
    dot: "bg-cyan-500 ring-cyan-100",
  },
  FIX: {
    label: "Perbaikan",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500 ring-amber-100",
  },
  SECURITY: {
    label: "Keamanan",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500 ring-emerald-100",
  },
};

function formatChangelogDate(value: string | null) {
  if (!value) return "Belum ditentukan";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function ChangelogSection({ items }: { items: ChangelogForClient[] }) {
  if (items.length === 0) return null;

  return (
    <section
      id="changelog"
      className="relative container mx-auto px-4 pb-16 pt-10 sm:px-6 md:pb-24"
    >
      <div className="mb-10 text-center" data-aos="fade-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
          <FiGitCommit className="h-4 w-4" />
          Changelog
        </span>
        <h2 className="mt-4 text-2xl font-black text-slate-950 md:text-3xl">
          Update Terbaru MarkasTI
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Ikuti fitur baru, peningkatan, dan perbaikan terbaru yang sudah
          tersedia di website.
        </p>
      </div>

      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-xl shadow-blue-900/10 backdrop-blur-xl sm:p-8">
        <div className="relative space-y-7 before:absolute before:bottom-3 before:left-[0.44rem] before:top-3 before:w-px before:bg-blue-100 sm:before:left-[0.56rem]">
          {items.map((item, index) => {
            const style = changelogStyle[item.type];
            return (
              <article
                key={item.id}
                className="relative pl-8 sm:pl-10"
                data-aos="fade-up"
                data-aos-delay={Math.min(index * 80, 320)}
              >
                <span
                  className={`absolute left-0 top-2 h-4 w-4 rounded-full ring-4 sm:h-5 sm:w-5 ${style.dot}`}
                />
                <div className="rounded-3xl border border-blue-100/80 bg-white/80 p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/10 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black tracking-wide text-white">
                      v{item.version}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${style.badge}`}
                    >
                      {style.label}
                    </span>
                    <time className="ml-auto text-xs font-semibold text-slate-400">
                      {formatChangelogDate(item.publishedAt)}
                    </time>
                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-950 sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.summary}
                  </p>

                  {item.details && (
                    <details className="group mt-4 rounded-2xl bg-blue-50/70 px-4 py-3">
                      <summary className="cursor-pointer list-none text-sm font-extrabold text-blue-700 marker:hidden">
                        <span className="group-open:hidden">Lihat detail update</span>
                        <span className="hidden group-open:inline">Tutup detail</span>
                      </summary>
                      <div className="mt-3 whitespace-pre-line border-t border-blue-100 pt-3 text-sm leading-7 text-slate-600">
                        {item.details}
                      </div>
                    </details>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [schedules, changelogs] = await Promise.all([
    getPublicSchedules(),
    getPublicChangelogs(5),
  ]);
  const todaySchedules = getTodaySchedules(schedules);
  const ongoingSchedule = getOngoingSchedule(schedules);

  const stats: StatCardProps[] = [
    {
      title: "Jadwal Aktif",
      value: `${schedules.length}`,
      desc: "Data dari backend",
      Icon: FiCalendar,
      delay: 0,
    },
    {
      title: "Jadwal Hari Ini",
      value: `${todaySchedules.length}`,
      desc: "Agenda hari ini",
      Icon: FiClock,
      delay: 120,
    },
    {
      title: "Fitur Portal",
      value: `${features.length}`,
      desc: "Menu utama",
      Icon: FiGrid,
      delay: 240,
    },
  ];

  return (
    <main
      className={`${jakarta.className} public-home relative min-h-screen overflow-hidden`}
    >

      <section className="relative container mx-auto px-4 pb-12 pt-24 sm:px-6 sm:pt-28 md:pb-24 md:pt-36">
        <div className="grid items-center gap-7 lg:grid-cols-2 lg:gap-12">
          <div
            className="space-y-5 text-center sm:space-y-7 lg:text-left"
            data-aos="fade-right"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700 shadow-sm backdrop-blur-md">
              <FiStar className="h-4 w-4" />
              Official Class Portal
            </div>

            <div className="space-y-4 sm:space-y-5">
              <SplitText
                text="Markas TI2 · Program Studi Teknik Informatika"
                className="text-xs font-extrabold uppercase tracking-wide text-blue-600 sm:text-sm"
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

              <h1
                className={`${orbitron.className} text-[2.35rem] font-black leading-[1.12] text-slate-950 sm:text-5xl lg:text-6xl`}
              >
                <TextType
                  text={["Selamat Datang", "Markas TI2"]}
                  typingSpeed={150}
                  pauseDuration={2000}
                  showCursor={true}
                  cursorCharacter="|"
                />
              </h1>

              <div className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 md:text-base lg:mx-0">
                <BlurText
                  text="Markas TI2 adalah pusat informasi kelas Teknik Informatika untuk melihat jadwal kuliah, struktur kelas, gallery, aturan, dan informasi penting lainnya dengan data yang lebih terhubung ke backend."
                  delay={80}
                  animateBy="words"
                  direction="top"
                />
              </div>
            </div>

            <div
              className="hidden flex-wrap justify-center gap-3 pt-2 sm:flex lg:justify-start"
              data-aos="fade-up"
              data-aos-delay="250"
            >
              <Link
                prefetch={true}
                href="/schedules"
                className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95"
              >
                <FiCalendar className="h-5 w-5" />
                Jadwal Kuliah
                <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                prefetch={true}
                href="/struktur-kelas"
                className="group inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-6 py-3 text-sm font-extrabold text-blue-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 active:scale-95"
              >
                <FiUsers className="h-5 w-5" />
                Struktur Kelas
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <DashboardPreview
              schedules={schedules}
              todaySchedules={todaySchedules}
              ongoingSchedule={ongoingSchedule}
            />

            <MobileQuickActions />
          </div>
        </div>
      </section>

      <section className="relative container mx-auto px-4 py-10 sm:px-6">
        <div className="mb-8 text-center" data-aos="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
            <FiTrendingUp className="h-4 w-4" />
            Statistik
          </span>

          <h2 className="mt-4 text-2xl font-black text-slate-950 md:text-3xl">
            Ringkasan Portal Kelas
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Statistik utama mengambil data jadwal aktif dari backend.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <section className="relative container mx-auto px-4 py-14 sm:px-6">
        <div className="mb-8 text-center" data-aos="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
            <FiGrid className="h-4 w-4" />
            Fitur
          </span>

          <h2 className="mt-4 text-2xl font-black text-slate-950 md:text-3xl">
            Fitur yang Tersedia
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Semua menu dibuat agar informasi kelas lebih mudah ditemukan,
            dibuka, dan dipantau.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <ChangelogSection items={changelogs} />
    </main>
  );
}
