"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import type { IconType } from "react-icons";
import {
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiFacebook,
  FiGithub,
  FiGlobe,
  FiInstagram,
  FiMail,
  FiPhone,
  FiShield,
  FiStar,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import type { StrukturKelas } from "@/libs/types";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

type PositionItem = {
  title: string;
  member?: StrukturKelas;
  Icon: IconType;
};

type MemberCardProps = {
  title: string;
  member?: StrukturKelas;
  Icon: IconType;
  highlight?: boolean;
  delay?: number;
};

function getSocialHref(type: string, value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const clean = value.replace(/^@/, "");

  if (type === "instagram") return `https://instagram.com/${clean}`;
  if (type === "facebook") return `https://facebook.com/${clean}`;
  if (type === "github") return `https://github.com/${clean}`;
  if (type === "website") return `https://${value}`;

  return null;
}

function MemberSocials({ member }: { member?: StrukturKelas }) {
  if (!member?.socials) return null;

  const links = [
    { type: "instagram", value: member.socials.instagram, Icon: FiInstagram },
    { type: "facebook", value: member.socials.facebook, Icon: FiFacebook },
    { type: "github", value: member.socials.github, Icon: FiGithub },
    { type: "website", value: member.socials.website, Icon: FiGlobe },
  ].filter((item) => Boolean(item.value));

  if (links.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {links.map(({ type, value, Icon }) => {
        const href = getSocialHref(type, value!);
        if (!href) return null;

        return (
          <a
            key={type}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${type} ${member.name}`}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-current transition hover:scale-110 hover:bg-cyan-400 hover:text-white"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}

function MemberCard({
  title,
  member,
  Icon,
  highlight = false,
  delay = 0,
}: MemberCardProps) {
  return (
    <Link
      href={member?.id ? `/teams#member-${member.id}` : "/teams"}
      className={`group relative w-full max-w-xs overflow-hidden rounded-3xl border p-5 text-center transition-all duration-300 hover:-translate-y-2 ${
        highlight
          ? "border-blue-300 bg-blue-600 text-white shadow-2xl shadow-blue-700/25"
          : "border-white/70 bg-white/80 text-slate-900 shadow-lg shadow-blue-900/5 backdrop-blur-xl hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/10"
      }`}
      data-aos="zoom-in-up"
      data-aos-delay={delay}
    >
      <div
        className={`absolute -right-14 -top-14 h-36 w-36 rounded-full blur-3xl transition-all duration-500 ${
          highlight
            ? "bg-white/20"
            : "bg-blue-300/20 group-hover:bg-blue-500/25"
        }`}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 group-hover:rotate-6 group-hover:scale-105 ${
            highlight
              ? "bg-white/15 text-white"
              : "bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white"
          }`}
        >
          <Icon className="h-8 w-8" />
        </div>

        <p
          className={`text-xs font-extrabold uppercase tracking-[0.22em] ${
            highlight ? "text-blue-100" : "text-blue-600"
          }`}
        >
          {member?.role || title}
        </p>

        <h3
          className={`mt-2 text-lg font-black ${
            highlight ? "text-white" : "text-slate-950"
          }`}
        >
          {member?.name || "Belum ditentukan"}
        </h3>

        {member?.contact ? (
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
              highlight
                ? "bg-white/15 text-blue-50"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {member.phone ? (
              <FiPhone className="h-4 w-4" />
            ) : (
              <FiMail className="h-4 w-4" />
            )}
            {member.contact}
          </div>
        ) : (
          <p
            className={`mt-3 text-xs ${
              highlight ? "text-blue-100" : "text-slate-400"
            }`}
          >
            Kontak belum tersedia
          </p>
        )}

        {member?.codeName && (
          <span className="mt-3 rounded-full bg-cyan-400/15 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-current">
            {member.codeName}
          </span>
        )}

        <MemberSocials member={member} />
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <main className="app-page-canvas min-h-screen pt-28">
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3">
            <div className="h-5 w-40 animate-pulse rounded-full bg-blue-200" />
            <div className="h-10 w-80 animate-pulse rounded-2xl bg-blue-200" />
            <div className="h-4 w-full max-w-lg animate-pulse rounded-full bg-blue-100" />
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="h-44 w-full max-w-xs animate-pulse rounded-3xl bg-white/80" />

            <div className="grid w-full gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-3xl bg-white/80"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function StrukturKelasPage() {
  const [struktur, setStruktur] = useState<StrukturKelas[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchStruktur = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/struktur-kelas", {
          cache: "no-store",
        });

        // if (!res.ok) {
        //   throw new Error(`HTTP ${res.status}`);
        // }

        const data = await res.json();

        const list: StrukturKelas[] = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

        setStruktur(list);
      } catch (error) {
        console.error("Failed to fetch struktur kelas:", error);
        setStruktur([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStruktur();
  }, []);


  const { ketua, wakil, sekretaris, bendahara1, bendahara2, otherMembers } =
    useMemo(() => {
      const ketua = struktur.find(
        (s) =>
          s.role?.toLowerCase().includes("ketua") &&
          !s.role?.toLowerCase().includes("wakil"),
      );

      const wakil = struktur.find((s) =>
        s.role?.toLowerCase().includes("wakil"),
      );

      const sekretaris = struktur.find((s) =>
        s.role?.toLowerCase().includes("sekretaris"),
      );

      const bendaharaList = struktur.filter((s) =>
        s.role?.toLowerCase().includes("bendahara"),
      );

      const bendahara1 = bendaharaList[0];
      const bendahara2 = bendaharaList[1];

      const mainMembers = [
        ketua,
        wakil,
        sekretaris,
        bendahara1,
        bendahara2,
      ].filter((member): member is StrukturKelas => Boolean(member));

      const otherMembers = struktur.filter(
        (member) => !mainMembers.includes(member),
      );

      return {
        ketua,
        wakil,
        sekretaris,
        bendahara1,
        bendahara2,
        otherMembers,
      };
    }, [struktur]);

  const positions: PositionItem[] = [
    {
      title: "Wakil Ketua",
      member: wakil,
      Icon: FiUserCheck,
    },
    {
      title: "Sekretaris",
      member: sekretaris,
      Icon: FiBriefcase,
    },
    {
      title: "Bendahara 1",
      member: bendahara1,
      Icon: FiShield,
    },
    {
      title: "Bendahara 2",
      member: bendahara2,
      Icon: FiShield,
    },
  ];

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <main
      className={`app-page-canvas ${jakarta.className} relative min-h-screen overflow-hidden pt-28`}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-72 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

      <section className="relative container mx-auto px-4 py-10 md:py-14">
        <header className="mx-auto max-w-3xl text-center" data-aos="fade-down">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700 shadow-sm backdrop-blur-md">
            <FiStar className="h-4 w-4" />
            Markas TI · Struktur Kelas
          </span>

          <h1
            className={`${orbitron.className} mt-5 text-3xl font-black leading-tight text-slate-950 md:text-5xl`}
          >
            Struktur Organisasi Kelas
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            Susunan pengurus kelas Teknik Informatika yang dibuat lebih rapi,
            interaktif, dan satu tema dengan tampilan MarkasTI.
          </p>
        </header>

        <div
          className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                <FiUsers className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Total Data
                </p>
                <h3 className="text-2xl font-black text-slate-950">
                  {struktur.length}
                </h3>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-600/20">
                <FiAward className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">
                  Ketua Kelas
                </p>
                <h3 className="truncate text-lg font-black text-slate-950">
                  {ketua?.name || "Belum ada"}
                </h3>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-600/20">
                <FiCheckCircle className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Status Data
                </p>
                <h3 className="text-lg font-black text-blue-700">
                  {struktur.length > 0 ? "Aktif" : "Kosong"}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Chart */}
        <div className="mt-12">
          {/* Ketua */}
          <div className="flex flex-col items-center">
            <MemberCard
              title="Ketua Kelas"
              member={ketua}
              Icon={FiAward}
              highlight
              delay={150}
            />
          </div>

          {/* Mobile Layout */}
          <div className="flex flex-col items-center lg:hidden">
            {positions.map((position: PositionItem, index: number) => (
              <div
                key={position.title}
                className="flex w-full flex-col items-center"
              >
                <div className="h-10 w-px bg-blue-300" />

                <MemberCard
                  title={position.title}
                  member={position.member}
                  Icon={position.Icon}
                  delay={250 + index * 120}
                />
              </div>
            ))}
          </div>

          {/* Desktop Layout */}
          <div className="mx-auto hidden w-full max-w-7xl lg:block">
            {/* garis dari ketua ke garis horizontal utama */}
            <div className="mx-auto h-10 w-px bg-blue-300" />

            {/* connector desktop */}
            <div className="grid grid-cols-4">
              {positions.map((position: PositionItem, index: number) => {
                const isFirst = index === 0;
                const isLast = index === positions.length - 1;

                return (
                  <div key={`line-${position.title}`} className="relative h-10">
                    {/* garis horizontal */}
                    {isFirst && (
                      <span className="absolute left-1/2 right-0 top-0 h-px bg-blue-300" />
                    )}

                    {!isFirst && !isLast && (
                      <span className="absolute left-0 right-0 top-0 h-px bg-blue-300" />
                    )}

                    {isLast && (
                      <span className="absolute left-0 right-1/2 top-0 h-px bg-blue-300" />
                    )}

                    {/* garis vertikal ke card */}
                    <span className="absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-blue-300" />
                  </div>
                );
              })}
            </div>

            {/* card desktop */}
            <div className="grid grid-cols-4">
              {positions.map((position: PositionItem, index: number) => (
                <div key={position.title} className="flex justify-center px-4">
                  <MemberCard
                    title={position.title}
                    member={position.member}
                    Icon={position.Icon}
                    delay={300 + index * 120}
                  />
                </div>
              ))}
            </div>
          </div>

          {struktur.length === 0 && (
            <div
              className="mx-auto mt-10 max-w-xl rounded-3xl border border-dashed border-blue-300 bg-white/70 p-6 text-center shadow-sm backdrop-blur-xl"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              <p className="text-sm font-bold text-slate-700">
                Data struktur kelas masih kosong.
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                Tambahkan data pengurus kelas dari backend agar struktur
                organisasi muncul di halaman ini.
              </p>
            </div>
          )}
        </div>

        {/* Pengurus Lainnya */}
        {otherMembers.length > 0 && (
          <section className="mt-16" data-aos="fade-up">
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                <FiUsers className="h-4 w-4" />
                Pengurus Lainnya
              </span>

              <h2 className="mt-4 text-2xl font-black text-slate-950">
                Anggota Struktur Tambahan
              </h2>
            </div>

            <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2 lg:grid-cols-3">
              {otherMembers.map((member: StrukturKelas, index: number) => (
                <div
                  key={`${member.role}-${member.name}-${index}`}
                  className="group rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10"
                  data-aos="zoom-in-up"
                  data-aos-delay={index * 100}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
                      <FiUsers className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">
                        {member.role || "Anggota"}
                      </p>

                      <h3 className="mt-1 text-base font-black text-slate-950">
                        {member.name}
                      </h3>

                      {member.contact && (
                        <p className="mt-2 text-xs text-slate-500">
                          {member.contact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
