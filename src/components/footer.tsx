"use client";

import Link from "next/link";
import {
  FiArrowUp,
  FiCalendar,
  FiCamera,
  FiCode,
  FiGithub,
  FiHeart,
  FiHome,
  FiInstagram,
  FiMail,
  FiUsers,
} from "react-icons/fi";
import MotionReveal from "@/components/animations/motionReveal";

const quickLinks = [
  {
    label: "Beranda",
    href: "/",
    icon: FiHome,
  },
  {
    label: "Jadwal",
    href: "/schedules",
    icon: FiCalendar,
  },
  {
    label: "Struktur Kelas",
    href: "/struktur-kelas",
    icon: FiUsers,
  },
  {
    label: "Gallery",
    href: "/gallery",
    icon: FiCamera,
  },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "#",
    icon: FiInstagram,
  },
  {
    label: "GitHub",
    href: "https://github.com/Aetyyy",
    icon: FiGithub,
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openGmail = () => {
    const email = "muhammad.irwan399@gmail.com";
    const subject = encodeURIComponent("Halo Muhammad Irwan");
    const body = encodeURIComponent(
      "Halo, saya ingin menghubungi kamu melalui MarkasTI.",
    );

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;

    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="app-footer relative w-full max-w-full overflow-x-clip border-t">
      <div className="relative mx-auto w-full max-w-[96rem] min-w-0 px-[var(--app-page-gutter)] py-10">
        <div className="grid min-w-0 gap-8 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr]">
          {/* Brand */}
          <MotionReveal variant="rise" className="min-w-0 space-y-5" delay={40}>
            <Link href="/" className="group inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 group-hover:rotate-6 group-hover:scale-105">
                <FiCode className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-wide text-slate-950">
                  MarkasTI
                </h2>
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-blue-600">
                  Teknik Informatika 2
                </p>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-7 text-slate-600">
              Portal kelas untuk melihat jadwal, struktur kelas, gallery, dan
              informasi penting mahasiswa Teknik Informatika 2.
            </p>

            <div className="footer-panel inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold text-blue-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              Class Portal Active
            </div>
          </MotionReveal>

          {/* Quick Links */}
          <MotionReveal variant="rise" delay={100} className="min-w-0">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-blue-700">
              Navigasi
            </h3>

            <div className="grid gap-2">
              {quickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="footer-nav-link ui-pressable group flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-semibold"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-all duration-300 group-hover:bg-white/20 group-hover:text-white">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </MotionReveal>

          {/* Contact */}
          <MotionReveal
            variant="rise"
            delay={160}
            className="min-w-0 md:col-span-2 lg:col-span-1"
          >
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-blue-700">
              Terhubung
            </h3>

            <div className="flex flex-wrap gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="footer-social ui-pressable group flex h-11 w-11 items-center justify-center rounded-2xl border text-blue-700"
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={openGmail}
                className="footer-social ui-pressable group flex h-11 w-11 items-center justify-center rounded-2xl border text-blue-700"
                aria-label="Buka Gmail"
              >
                <FiMail className="h-5 w-5" />
              </button>
            </div>

            <div className="footer-panel mt-5 rounded-3xl border p-4">
              <p className="text-xs font-semibold text-slate-500">Created by</p>

              <p className="mt-1 text-sm font-black text-slate-950">
                Muhammad Irwan{" "}
                <span className="text-xs font-semibold text-slate-500">
                  (main creator)
                </span>
              </p>

              <p className="mt-1 text-sm font-black text-slate-950">
                Hasan Hadiwijaya{" "}
                <span className="text-xs font-semibold text-slate-500">
                  (contributor)
                </span>
              </p>

              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                Made with <FiHeart className="text-blue-600" /> for TI2
              </p>
            </div>
          </MotionReveal>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-blue-100 pt-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} Class TI2. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-3">
            <span className="footer-panel rounded-full border px-3 py-1 font-semibold text-blue-700">
              MarkasTI v1.0
            </span>

            <button
              type="button"
              onClick={scrollToTop}
              className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 active:scale-95"
            >
              Ke Atas
              <FiArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
