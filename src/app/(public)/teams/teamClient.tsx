"use client";

import { usePresence } from "@/components/presence/usePresence";
import { getDisplayImageUrl } from "@/libs/api/imageUrl";
import { useEffect, useMemo, useRef, useState } from "react";
import { JetBrains_Mono, Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import type { ClassMemberRole, ClassMemberStatus } from "@/types/member";
import { roleLabels, roleOptions, statusLabels } from "@/types/member";
import type { IconType } from "react-icons";
import {
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiCode,
  FiCpu,
  FiDatabase,
  FiFilter,
  FiGithub,
  FiHash,
  FiLayers,
  FiLock,
  FiSearch,
  FiShield,
  FiTerminal,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import {
  FaDiscord,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";

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

export type PublicMember = {
  id: string;
  name: string;
  nim: string;
  role: ClassMemberRole;
  image: string | null;
  quote: string;
  codeName: string | null;
  status: ClassMemberStatus;
  sortOrder: number;
  isPrivate: boolean;
  skills: string[];
  organizations: {
    name: string;
    rank: string;
  }[];
  socials: {
    instagram: string | null;
    facebook: string | null;
    discord: string | null;
    tiktok: string | null;
    github: string | null;
  } | null;
};

type MemberSocials = NonNullable<PublicMember["socials"]>;

function isPrototypeImage(src?: string | null) {
  return !src || src.startsWith("prototype://") || src.startsWith("data:");
}

function isStructureRole(role: ClassMemberRole) {
  return role !== "ANGGOTA";
}

function getInitial(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusStyle(status: PublicMember["status"]) {
  if (status === "ONLINE") {
    return {
      label: "Online",
      className: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  return {
    label: "Offline",
    className: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  };
}

function makeSocialUrl(type: keyof MemberSocials, value: string) {
  if (value.startsWith("http")) return value;

  const clean = value.replace("@", "").trim().replace(/\s+/g, ".");

  if (type === "instagram") return `https://instagram.com/${clean}`;
  if (type === "facebook") return `https://facebook.com/${clean}`;
  if (type === "tiktok") return `https://tiktok.com/@${clean}`;
  if (type === "github") return `https://github.com/${clean}`;

  return "#";
}

function useLazyRender(rootMargin = "280px") {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      },
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return { ref, shouldRender };
}

function PrototypeMemberVisual({ member }: { member: PublicMember }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-cyan-200/20 blur-3xl" />

      <div className="absolute inset-0 opacity-20">
        <div className="grid h-full w-full grid-cols-5 gap-3 p-5">
          {Array.from({ length: 25 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-white/30" />
          ))}
        </div>
      </div>

      <div className="relative z-10 text-center text-white">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-4xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md transition-all duration-300 group-hover:rotate-6 group-hover:scale-105">
          <span
            className={`${orbitron.className} text-4xl font-black text-white`}
          >
            {getInitial(member.name)}
          </span>
        </div>

        <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-blue-100">
          {member.isPrivate ? "Private Member" : "Prototype Member"}
        </p>

        <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-md">
          {member.isPrivate ? (
            <>
              <FiLock className="h-4 w-4" />
              private_profile()
            </>
          ) : (
            <>
              <FiTerminal className="h-4 w-4" />
              team_photo_not_uploaded()
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberPhoto({ member }: { member: PublicMember }) {
  const [imageError, setImageError] = useState(false);
  const prototype = isPrototypeImage(member.image);

  if (prototype || imageError) {
    return <PrototypeMemberVisual member={member} />;
  }

  return (
    <div className="relative h-full w-full bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getDisplayImageUrl(member.image as string)}
        alt={member.name}
        loading="lazy"
        onError={() => setImageError(true)}
        onDragStart={(event) => event.preventDefault()}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

function SocialLinks({ socials }: { socials: PublicMember["socials"] }) {
  const items: {
    key: keyof MemberSocials;
    label: string;
    value?: string | null;
    Icon: IconType;
    className: string;
  }[] = [
    {
      key: "instagram",
      label: "Instagram",
      value: socials?.instagram,
      Icon: FaInstagram,
      className: "hover:bg-pink-500 hover:text-white",
    },
    {
      key: "facebook",
      label: "Facebook",
      value: socials?.facebook,
      Icon: FaFacebookF,
      className: "hover:bg-blue-700 hover:text-white",
    },
    {
      key: "discord",
      label: "Discord",
      value: socials?.discord,
      Icon: FaDiscord,
      className: "hover:bg-indigo-600 hover:text-white",
    },
    {
      key: "tiktok",
      label: "TikTok",
      value: socials?.tiktok,
      Icon: FaTiktok,
      className: "hover:bg-slate-950 hover:text-white",
    },
    {
      key: "github",
      label: "GitHub",
      value: socials?.github,
      Icon: FaGithub,
      className: "hover:bg-slate-800 hover:text-white",
    },
  ];

  const available = items.filter((item) => item.value);

  if (available.length === 0) {
    return (
      <div className="mt-3 rounded-2xl border border-dashed border-blue-100 bg-blue-50/60 px-4 py-3 text-xs font-bold text-slate-500">
        Social media belum ditambahkan.
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {available.map((item) => {
        const Icon = item.Icon;
        const isDiscord = item.key === "discord";

        if (isDiscord) {
          return (
            <span
              key={item.key}
              title={`${item.label}: ${item.value}`}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 text-blue-700 shadow-sm transition-all duration-300 hover:-translate-y-1 ${item.className}`}
            >
              <Icon className="h-5 w-5" />
            </span>
          );
        }

        return (
          <a
            key={item.key}
            href={makeSocialUrl(item.key, item.value as string)}
            target="_blank"
            rel="noreferrer"
            title={`${item.label}: ${item.value}`}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 text-blue-700 shadow-sm transition-all duration-300 hover:-translate-y-1 ${item.className}`}
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}

function OrganizationBadges({
  organizations,
}: {
  organizations: PublicMember["organizations"];
}) {
  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {organizations.map((organization) => (
        <div
          key={`${organization.name}-${organization.rank}`}
          className="group/org rounded-3xl border border-blue-100 bg-blue-50/80 p-3 transition-all duration-300 hover:border-blue-300 hover:bg-white"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all duration-300 group-hover/org:rotate-6 group-hover/org:scale-105">
              <FiBriefcase className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black text-slate-950">
                {organization.name}
              </p>

              <p
                className={`${jetbrains.className} mt-1 inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-bold text-blue-700 shadow-sm`}
              >
                {organization.rank}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
  desc,
  Icon,
  delay,
}: {
  title: string;
  value: string | number;
  desc: string;
  Icon: IconType;
  delay: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-4xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10"
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-300/20 blur-3xl transition-all duration-300 group-hover:bg-blue-500/20" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 group-hover:rotate-6 group-hover:scale-105">
          <Icon className="h-6 w-6" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="text-2xl font-black text-slate-950">{value}</h3>
          <p className="text-xs font-semibold text-blue-700">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function MemberCardSkeleton() {
  return (
    <div className="flex h-full min-h-[42rem] flex-col overflow-hidden rounded-4xl border border-white/70 bg-white/60 p-3 shadow-lg shadow-blue-900/5 backdrop-blur-xl">
      <div className="aspect-4/5 animate-pulse rounded-[1.45rem] bg-linear-to-br from-blue-100 via-sky-100 to-cyan-100" />

      <div className="p-3">
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-blue-100" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-blue-100" />
        <div className="mt-3 h-20 w-full animate-pulse rounded-3xl bg-blue-50" />
        <div className="mt-3 h-24 w-full animate-pulse rounded-3xl bg-blue-50" />
      </div>
    </div>
  );
}

function MemberCard({
  member,
  index,
}: {
  member: PublicMember;
  index: number;
}) {
  const structureRole = isStructureRole(member.role);
  const status = getStatusStyle(member.status);

  return (
    <article
      className="group relative flex h-full min-h-[42rem] flex-col overflow-hidden rounded-4xl border border-white/70 bg-white/75 p-3 shadow-lg shadow-blue-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/15"
      data-aos="zoom-in-up"
      data-aos-delay={Math.min(index * 60, 420)}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-300/20 blur-3xl transition-all duration-500 group-hover:bg-blue-500/25" />

      <div className="relative aspect-4/5 overflow-hidden rounded-[1.45rem] bg-blue-100">
        <MemberPhoto member={member} />

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-80" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-black text-white shadow-sm backdrop-blur-md">
            {member.isPrivate ? (
              <FiLock className="h-3.5 w-3.5" />
            ) : structureRole ? (
              <FiShield className="h-3.5 w-3.5" />
            ) : (
              <FiUser className="h-3.5 w-3.5" />
            )}
            {member.isPrivate ? "Private" : roleLabels[member.role]}
          </span>

          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black ${status.className}`}
          >
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-sm backdrop-blur-md transition-all duration-300 group-hover:rotate-6 group-hover:scale-105">
          {member.isPrivate ? (
            <FiLock className="h-5 w-5" />
          ) : structureRole ? (
            <FiAward className="h-5 w-5" />
          ) : (
            <FiCode className="h-5 w-5" />
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <p
            className={`${jetbrains.className} mb-2 inline-flex items-center gap-2 rounded-full bg-blue-500/80 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md`}
          >
            <FiTerminal className="h-3.5 w-3.5" />
            {member.isPrivate ? "PRIVATE" : member.codeName || "STD"}
          </p>

          <h2 className="text-lg font-black leading-snug text-white md:text-xl">
            {member.name}
          </h2>

          {!member.isPrivate && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-black text-blue-700">
                <FiHash className="h-3.5 w-3.5" />
                {member.nim}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-3">
        {member.isPrivate ? (
          <div className="rounded-3xl border border-blue-100 bg-blue-50/80 p-4 text-sm font-bold leading-7 text-slate-600">
            Profile ini private.
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {member.skills.length === 0 ? (
                <span
                  className={`${jetbrains.className} rounded-full border border-dashed border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-slate-500`}
                >
                  #Skill belum ditambahkan
                </span>
              ) : (
                member.skills.map((item) => (
                  <span
                    key={item}
                    className={`${jetbrains.className} rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700`}
                  >
                    #{item}
                  </span>
                ))
              )}
            </div>

            <div
              className={`${jetbrains.className} rounded-3xl border border-blue-100 bg-white/80 px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm`}
            >
              <span className="font-bold text-blue-700">quote:</span>{" "}
              {member.quote || "Quote belum ditambahkan."}
            </div>

            <OrganizationBadges organizations={member.organizations} />

            <div className="mt-auto pt-3">
              <SocialLinks socials={member.socials} />
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function LazyMemberCard({
  member,
  index,
}: {
  member: PublicMember;
  index: number;
}) {
  const { ref, shouldRender } = useLazyRender();

  return (
    <div
      ref={ref}
      id={`member-${member.id}`}
      className="h-full min-h-[42rem] scroll-mt-32 rounded-4xl target:ring-4 target:ring-cyan-300 target:ring-offset-4"
    >
      {shouldRender ? (
        <MemberCard member={member} index={index} />
      ) : (
        <MemberCardSkeleton />
      )}
    </div>
  );
}

export default function AnggotaClient({
  members,
}: {
  members: PublicMember[];
}) {
  const { data: presenceResponse } = usePresence(15_000);
  const memberStatuses = useMemo<Record<string, ClassMemberStatus>>(
    () =>
      Object.fromEntries(
        (presenceResponse?.data ?? []).map((item) => [item.id, item.status]),
      ),
    [presenceResponse?.data],
  );
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState<"Semua" | ClassMemberRole>(
    "Semua",
  );
  const [activeStatus, setActiveStatus] = useState<"Semua" | ClassMemberStatus>(
    "Semua",
  );

  useEffect(() => {
    const revealTarget = () => {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      if (!targetId) return;

      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    };

    revealTarget();
    window.addEventListener("hashchange", revealTarget);
    return () => window.removeEventListener("hashchange", revealTarget);
  }, []);

  const liveMembers = useMemo(() => {
    return members.map((member) => ({
      ...member,
      status: memberStatuses[member.id] ?? member.status,
    }));
  }, [members, memberStatuses]);

  const totalStructure = liveMembers.filter((member) =>
    isStructureRole(member.role),
  ).length;

  const totalRegularMembers = liveMembers.filter(
    (member) => member.role === "ANGGOTA",
  ).length;

  const totalOrganizations = new Set(
    liveMembers.flatMap((member) =>
      member.isPrivate
        ? []
        : member.organizations.map((organization) => organization.name),
    ),
  ).size;

  const totalOrganizationMembership = liveMembers.reduce((total, member) => {
    return total + (member.isPrivate ? 0 : member.organizations.length);
  }, 0);

  const totalSocials = liveMembers.reduce((total, member) => {
    return total + Object.values(member.socials ?? {}).filter(Boolean).length;
  }, 0);

  const totalOnline = liveMembers.filter(
    (member) => member.status === "ONLINE",
  ).length;

  const filteredMembers = useMemo(() => {
    return liveMembers.filter((member) => {
      const keyword = search.toLowerCase();

      const privateSearch = [
        member.name,
        roleLabels[member.role],
        statusLabels[member.status],
        member.isPrivate ? "private" : "",
      ]
        .join(" ")
        .toLowerCase();

      const publicSearch = [
        member.name,
        member.nim,
        roleLabels[member.role],
        statusLabels[member.status],
        member.codeName ?? "",
        member.skills.join(" "),
        member.organizations
          .map((organization) => `${organization.name} ${organization.rank}`)
          .join(" "),
        Object.values(member.socials ?? {}).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = member.isPrivate
        ? privateSearch.includes(keyword)
        : publicSearch.includes(keyword);

      const matchRole = activeRole === "Semua" || member.role === activeRole;
      const matchStatus =
        activeStatus === "Semua" || member.status === activeStatus;

      return matchSearch && matchRole && matchStatus;
    });
  }, [liveMembers, search, activeRole, activeStatus]);

  return (
    <main
      className={`app-page-canvas ${jakarta.className} relative min-h-screen overflow-hidden pt-28`}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-80 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

      <section className="relative container mx-auto px-4 py-10 md:py-14">
        <div
          className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/75 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl md:p-8"
          data-aos="fade-down"
        >
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/70 via-white/35 to-blue-100/40" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                <FiUsers className="h-4 w-4" />
                Markas TI · Class Members
              </span>

              <h1
                className={`${orbitron.className} mt-5 text-3xl font-black leading-tight text-slate-950 md:text-5xl`}
              >
                Anggota Kelas TI2
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Direktori digital anggota kelas Teknik Informatika 2.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                  <FiCpu className="h-4 w-4" />
                  Informatics Engineering
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700">
                  <FiDatabase className="h-4 w-4" />
                  Database Connected
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700">
                  <FiGithub className="h-4 w-4" />
                  Social Connected
                </div>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-[1.7rem] bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500 p-6 text-white shadow-2xl shadow-blue-700/25"
              data-aos="zoom-in-left"
              data-aos-delay="200"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                    <FiTerminal className="h-7 w-7" />
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">
                    DATABASE
                  </span>
                </div>

                <p
                  className={`${jetbrains.className} mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100`}
                >
                  prisma.user.findMany()
                </p>

                <h2
                  className={`${orbitron.className} mt-2 text-4xl font-black`}
                >
                  {members.length}+
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-50">
                  Data team memakai User, team image terpisah dari foto profile.
                </p>

                <div
                  className={`${jetbrains.className} mt-5 rounded-3xl bg-white/15 p-4 text-xs leading-6 text-blue-50 backdrop-blur-md`}
                >
                  <p>
                    status:{" "}
                    <span className="text-white">{totalOnline} online</span>
                  </p>
                  <p>
                    role:{" "}
                    <span className="text-white">
                      {totalStructure} struktur kelas
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Anggota"
            value={members.length}
            desc="Data mahasiswa"
            Icon={FiUsers}
            delay={100}
          />

          <StatCard
            title="Struktur Kelas"
            value={totalStructure}
            desc="Ketua, wakil, sekretaris, bendahara"
            Icon={FiShield}
            delay={180}
          />

          <StatCard
            title="Mahasiswa"
            value={totalRegularMembers}
            desc="Anggota biasa"
            Icon={FiBookOpen}
            delay={260}
          />

          <StatCard
            title="Organisasi / UKM"
            value={totalOrganizations}
            desc={`${totalOrganizationMembership} keanggotaan · ${totalSocials} sosial`}
            Icon={FiLayers}
            delay={340}
          />
        </div>

        <div
          className="mt-8 rounded-4xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-blue-900/5 backdrop-blur-xl"
          data-aos="fade-up"
        >
          <div className="grid gap-4 xl:grid-cols-[1fr_0.5fr_0.4fr] xl:items-center">
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <FiSearch className="h-5 w-5" />
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, role, skill, organisasi, status..."
                className="w-full rounded-3xl border border-blue-100 bg-white/80 py-4 pl-16 pr-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={activeRole}
              onChange={(event) =>
                setActiveRole(event.target.value as "Semua" | ClassMemberRole)
              }
              className="rounded-3xl border border-blue-100 bg-white/80 px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="Semua">Semua Role</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>

            <select
              value={activeStatus}
              onChange={(event) =>
                setActiveStatus(
                  event.target.value as "Semua" | ClassMemberStatus,
                )
              }
              className="rounded-3xl border border-blue-100 bg-white/80 px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="Semua">Semua Status</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <FiFilter className="h-4 w-4 text-blue-600" />
            Menampilkan{" "}
            <span className="rounded-full bg-blue-100 px-2 py-1 font-black text-blue-700">
              {filteredMembers.length}
            </span>{" "}
            dari {members.length} anggota.
          </div>
        </div>

        <section className="mt-8">
          {members.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-blue-300 bg-white/70 p-10 text-center shadow-sm backdrop-blur-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                <FiUsers className="h-8 w-8" />
              </div>

              <h2 className="mt-4 text-lg font-black text-slate-900">
                Data anggota masih kosong
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Data user belum tersedia di database.
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-blue-300 bg-white/70 p-10 text-center shadow-sm backdrop-blur-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                <FiSearch className="h-8 w-8" />
              </div>

              <h2 className="mt-4 text-lg font-black text-slate-900">
                Anggota tidak ditemukan
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Coba gunakan kata kunci lain, ubah filter role, atau status.
              </p>
            </div>
          ) : (
            <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMembers.map((member, index) => (
                <LazyMemberCard key={member.id} member={member} index={index} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
