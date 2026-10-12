import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";
import { getDisplayImageUrl } from "@/libs/api/imageUrl";
import { JetBrains_Mono, Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiGlobe,
  FiMail,
  FiPhone,
  FiShield,
  FiTerminal,
  FiUser,
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

type PageProps = {
  params: Promise<{
    nim: string;
  }>;
};

function getInitial(name?: string | null) {
  return String(name ?? "U")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isPrototypeImage(src?: string | null) {
  return !src || src.startsWith("prototype://");
}

function makeSocialUrl(type: string, value: string) {
  if (value.startsWith("http")) return value;

  const clean = value.replace("@", "").trim().replace(/\s+/g, ".");

  if (type === "instagram") return `https://instagram.com/${clean}`;
  if (type === "facebook") return `https://facebook.com/${clean}`;
  if (type === "tiktok") return `https://tiktok.com/@${clean}`;
  if (type === "github") return `https://github.com/${clean}`;
  if (type === "website") {
    return value.startsWith("http") ? value : `https://${value}`;
  }

  return "#";
}

function SocialCard({
  type,
  label,
  value,
  Icon,
}: {
  type: string;
  label: string;
  value: string;
  Icon: IconType;
}) {
  const content = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-black text-slate-800">
          {value}
        </p>
      </div>
    </>
  );

  if (type === "discord") {
    return (
      <div
        title={`${label}: ${value}`}
        className="flex items-center gap-3 rounded-3xl border border-blue-100 bg-white/80 p-3 shadow-sm"
      >
        {content}
      </div>
    );
  }

  return (
    <a
      href={makeSocialUrl(type, value)}
      target="_blank"
      rel="noreferrer"
      title={`${label}: ${value}`}
      className="flex items-center gap-3 rounded-3xl border border-blue-100 bg-white/80 p-3 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:bg-white"
    >
      {content}
    </a>
  );
}

export default async function ProfileViewPage({ params }: PageProps) {
  const session = await auth();

  // if (!session?.user) {
  //   redirect("/login");
  // }

  const sessionUser = session?.user as {
    id?: string | null;
    email?: string | null;
  };

  const { nim } = await params;
  const decodedNim = decodeURIComponent(nim);

  let currentUser = null;

  if (sessionUser?.id) {
    currentUser = await prisma.user.findUnique({
      where: {
        id: sessionUser.id,
      },
      select: {
        id: true,
        nim: true,
      },
    });
  }

  if (!currentUser && sessionUser?.email) {
    currentUser = await prisma.user.findUnique({
      where: {
        email: sessionUser.email,
      },
      select: {
        id: true,
        nim: true,
      },
    });
  }

  // if (!currentUser) {
  //   redirect("/login");
  // }

  const user = await prisma.user.findUnique({
    where: {
      nim: decodedNim,
    },
    include: {
      skills: {
        orderBy: {
          createdAt: "asc",
        },
      },
      organizations: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const isOwner = currentUser?.id === user.id;

  if (!user.publicProfile && !isOwner) {
    return (
      <main
        className={`app-page-canvas ${jakarta.className} min-h-screen pt-28`}
      >
        <section className="container mx-auto px-4 py-14">
          <div className="mx-auto max-w-xl rounded-4xl border border-white/80 bg-white/80 p-8 text-center shadow-xl shadow-blue-900/5 backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
              <FiShield className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950">
              Profile Private
            </h1>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              User ini menonaktifkan public profile.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const socials: {
    type: string;
    label: string;
    value: string;
    Icon: IconType;
  }[] = [
    {
      type: "instagram",
      label: "Instagram",
      value: user.instagram ?? "",
      Icon: FaInstagram,
    },
    {
      type: "facebook",
      label: "Facebook",
      value: user.facebook ?? "",
      Icon: FaFacebookF,
    },
    {
      type: "discord",
      label: "Discord",
      value: user.discord ?? "",
      Icon: FaDiscord,
    },
    {
      type: "tiktok",
      label: "TikTok",
      value: user.tiktok ?? "",
      Icon: FaTiktok,
    },
    {
      type: "github",
      label: "GitHub",
      value: user.github ?? "",
      Icon: FaGithub,
    },
    {
      type: "website",
      label: "Website",
      value: user.website ?? "",
      Icon: FiGlobe,
    },
  ].filter((item) => item.value.trim().length > 0);

  const showSocials = user.showSocials || isOwner;

  return (
    <main
      className={`app-page-canvas ${jakarta.className} relative min-h-screen overflow-hidden pt-28`}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-80 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

      <section className="relative container mx-auto px-4 py-10 md:py-14">
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-4xl border border-white/80 bg-white/75 p-4 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
            <div className="relative aspect-square overflow-hidden rounded-[1.8rem] bg-blue-100">
              {isPrototypeImage(user.image) ? (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-cyan-200/20 blur-3xl" />

                  <div className="absolute inset-0 opacity-20">
                    <div className="grid h-full w-full grid-cols-5 gap-3 p-5">
                      {Array.from({ length: 25 }).map((_, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-white/30"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 text-center text-white">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
                      <span
                        className={`${orbitron.className} text-4xl font-black`}
                      >
                        {getInitial(user.name)}
                      </span>
                    </div>

                    <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                      Profile Member
                    </p>
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getDisplayImageUrl(user.image)}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              )}

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {isOwner && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/20 px-3 py-1.5 text-[11px] font-black text-white shadow-sm backdrop-blur-md">
                    <FiShield className="h-3.5 w-3.5" />
                    Profile Saya
                  </span>
                )}

                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/20 px-3 py-1.5 text-[11px] font-black text-white shadow-sm backdrop-blur-md">
                  <FiUser className="h-3.5 w-3.5" />
                  NIM {user.nim}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <p
                  className={`${jetbrains.className} mb-2 inline-flex items-center gap-2 rounded-full bg-blue-500/85 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md`}
                >
                  <FiTerminal className="h-3.5 w-3.5" />
                  /profile/{user.nim}
                </p>

                <h1 className="text-2xl font-black leading-tight text-white">
                  {user.name}
                </h1>
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-white/80 bg-white/75 p-6 shadow-xl shadow-blue-900/5 backdrop-blur-xl md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
              <FiUser className="h-4 w-4" />
              Member Profile
            </span>

            <h2
              className={`${orbitron.className} mt-5 text-3xl font-black leading-tight text-slate-950 md:text-5xl`}
            >
              {user.name}
            </h2>

            {isOwner && (
              <Link
                href="/profile"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 transition hover:bg-emerald-200"
              >
                <FiShield className="h-4 w-4" />
                Edit profile saya
              </Link>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-blue-100 bg-white/80 p-4">
                <p className="text-xs font-bold text-slate-500">Email</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-black text-slate-800">
                  <FiMail className="h-4 w-4 text-blue-600" />
                  {user.email}
                </p>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-white/80 p-4">
                <p className="text-xs font-bold text-slate-500">No. HP</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-black text-slate-800">
                  <FiPhone className="h-4 w-4 text-blue-600" />
                  {user.phone || "Belum ditambahkan"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-blue-100 bg-white/80 p-5">
              <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                <FiBookOpen className="h-4 w-4" />
                Bio
              </p>

              <p className="text-sm leading-7 text-slate-600">
                {user.bio || "Bio belum ditambahkan."}
              </p>
            </div>

            <div
              className={`${jetbrains.className} mt-5 rounded-3xl border border-blue-100 bg-blue-50/80 p-5 text-xs leading-6 text-slate-600`}
            >
              <span className="font-black text-blue-700">quote:</span>{" "}
              {user.quote || "Quote belum ditambahkan."}
            </div>

            <div className="mt-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                <FiAward className="h-4 w-4" />
                Skill
              </p>

              {user.skills.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-sm font-bold text-slate-500">
                  Skill belum ditambahkan.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                <FiBriefcase className="h-4 w-4" />
                Organisasi / UKM
              </p>

              {user.organizations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-sm font-bold text-slate-500">
                  Organisasi belum ditambahkan.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {user.organizations.map((organization) => (
                    <div
                      key={organization.id}
                      className="rounded-3xl border border-blue-100 bg-white/80 p-4"
                    >
                      <p className="text-sm font-black text-slate-950">
                        {organization.name}
                      </p>

                      <p
                        className={`${jetbrains.className} mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700`}
                      >
                        {organization.rank}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showSocials && (
              <div className="mt-5">
                <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  <FiGlobe className="h-4 w-4" />
                  Social Media
                </p>

                {socials.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-sm font-bold text-slate-500">
                    Social media belum ditambahkan.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {socials.map((item) => (
                      <SocialCard
                        key={item.type}
                        type={item.type}
                        label={item.label}
                        value={item.value}
                        Icon={item.Icon}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
