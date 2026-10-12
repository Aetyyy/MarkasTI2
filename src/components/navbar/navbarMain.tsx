"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { RiArrowDropDownLine } from "react-icons/ri";
import { Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import {
  FiCalendar,
  FiBell,
  FiCamera,
  FiGrid,
  FiDollarSign,
  FiHome,
  FiLayers,
  FiShield,
  FiUsers,
  FiX,
} from "react-icons/fi";
import FastAccountMenu from "@/components/auth/fastAccountMenu";
import NotificationBellButton from "@/components/notifications/notificationBellButton";
import SafeNavLink from "@/components/navigation/safeNavLink";
import ThemeToggle from "@/components/theme/themeToggle";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const mainLinks = [
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
    label: "Gallery",
    href: "/gallery",
    icon: FiCamera,
  },
];

const aboutLinks = [
  {
    label: "Pengumuman",
    href: "/announcements",
    icon: FiBell,
  },
  {
    label: "Uang Kas",
    href: "/transkrip-kas",
    icon: FiDollarSign,
  },
  {
    label: "Task Reminder",
    href: "/task-reminder",
    icon: FiBell,
  },
  {
    label: "Struktur Kelas",
    href: "/struktur-kelas",
    icon: FiUsers,
  },
  {
    label: "Anggota",
    href: "/teams",
    icon: FiLayers,
  },
  {
    label: "Aturan",
    href: "/rules",
    icon: FiShield,
  },
];

export default function NavbarMain() {
  const pathname = usePathname();
  const { status } = useSession();

  const scrollStateRef = useRef(false);
  const desktopAboutRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isTentangOpen, setIsTentangOpen] = useState(false);
  const [isDesktopAboutOpen, setIsDesktopAboutOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const visibleAboutLinks = aboutLinks.filter(
    (item) => item.href !== "/task-reminder" || status === "authenticated",
  );
  const isAboutActive = visibleAboutLinks.some(
    (item) => pathname === item.href,
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsOpen(false);
      setIsTentangOpen(false);
      setIsDesktopAboutOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    let ticking = false;

    function updateScrolled() {
      const nextScrolled = window.scrollY > 18;

      if (scrollStateRef.current !== nextScrolled) {
        scrollStateRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }

      ticking = false;
    }

    function handleScroll() {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(updateScrolled);
    }

    updateScrolled();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isDesktopAboutOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (!desktopAboutRef.current?.contains(target)) {
        setIsDesktopAboutOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDesktopAboutOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDesktopAboutOpen]);

  function toggleMenu() {
    setIsOpen((prev) => {
      const next = !prev;

      if (!next) {
        setIsTentangOpen(false);
      }

      return next;
    });
  }

  function closeMobileMenu() {
    setIsOpen(false);
    setIsTentangOpen(false);
  }

  function navLinkClass(href: string) {
    const isActive = pathname === href;

    return `app-nav-link ui-pressable group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold ${
      isActive ? "app-nav-link-active" : ""
    }`;
  }

  function mobileLinkClass(href: string) {
    const isActive = pathname === href;

    return `app-mobile-link ui-pressable group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold ${
      isActive ? "app-mobile-link-active" : ""
    }`;
  }

  return (
    <header
      className={`${jakarta.className} app-navbar-header fixed left-0 top-0 z-50 w-full px-3 transition-[padding] duration-200 ${
        isScrolled ? "py-2" : "py-3"
      }`}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        data-scrolled={isScrolled}
        className="app-navbar-shell mx-auto w-full max-w-[1540px] min-w-0 overflow-visible rounded-[1.65rem]"
      >
        <div className="relative overflow-visible rounded-[1.65rem]">
          <div className="app-navbar-row relative grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 sm:px-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:gap-3 xl:py-3">
            <Link
              href="/"
              aria-label="MarkasTI — Beranda"
              prefetch={false}
              onClick={closeMobileMenu}
              className="group col-start-1 flex min-w-0 items-center gap-2.5 justify-self-start sm:gap-3"
            >
              <div className="app-brand-mark relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[1.05rem] transition duration-150 group-hover:-rotate-3 sm:h-12 sm:w-12 sm:rounded-[1.2rem]">
                <svg aria-hidden="true" viewBox="0 0 40 40" className="relative h-8 w-8 sm:h-9 sm:w-9" fill="none">
                  <path d="M8 29V11l8 11 4-6 4 6 8-11v18" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 11h24" stroke="white" strokeOpacity=".58" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="32" cy="29" r="2" fill="#9FF4F0" />
                </svg>
              </div>

              <div className="leading-none">
                <h1
                  className={`${orbitron.className} whitespace-nowrap bg-gradient-to-r from-blue-800 via-blue-600 to-cyan-500 bg-clip-text text-lg font-black tracking-wide text-transparent sm:text-xl md:text-2xl`}
                >
                  MarkasTI
                </h1>

                <p className="mt-1 hidden text-[10px] font-extrabold uppercase tracking-[0.28em] text-slate-500 sm:block">
                  Teknik Informatika
                </p>
              </div>
            </Link>

            <nav className="app-navbar-nav hidden items-center gap-1 rounded-full border p-1.5 xl:flex">
              {mainLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <SafeNavLink
                    key={item.href}
                    href={item.href}
                    className={navLinkClass(item.href)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </SafeNavLink>
                );
              })}

              <div ref={desktopAboutRef} className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setIsDesktopAboutOpen((current) => !current)}
                  aria-expanded={isDesktopAboutOpen}
                  aria-haspopup="menu"
                  className={`app-nav-link ui-pressable inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-extrabold ${
                    isAboutActive ? "app-nav-link-active" : ""
                  }`}
                >
                  <FiGrid className="h-4 w-4" />
                  Tentang
                  <RiArrowDropDownLine className="ui-chevron h-6 w-6" />
                </button>

                <div
                  className="app-navbar-popover ui-popover absolute left-1/2 top-[calc(100%+0.7rem)] z-50 w-60"
                  data-state={isDesktopAboutOpen ? "open" : "closed"}
                  aria-hidden={!isDesktopAboutOpen}
                  inert={!isDesktopAboutOpen}
                  style={
                    { "--motion-origin": "top center" } as React.CSSProperties
                  }
                >
                  <div
                    className="app-navbar-dropdown overflow-hidden rounded-[1.35rem] border p-2"
                    role="menu"
                  >
                    {visibleAboutLinks.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;

                      return (
                        <SafeNavLink
                          href={item.href}
                          key={item.href}
                          onNavigate={closeMobileMenu}
                          className={`navbar-dropdown-link ui-pressable group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold ${
                            active ? "navbar-dropdown-link-active" : ""
                          }`}
                        >
                          <span className="navbar-dropdown-icon flex h-9 w-9 items-center justify-center rounded-xl transition duration-150">
                            <Icon className="h-4 w-4" />
                          </span>

                          <span>{item.label}</span>
                        </SafeNavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            </nav>

            <div className="hidden items-center gap-2 justify-self-end xl:col-start-3 xl:flex">
              <ThemeToggle />
              <NotificationBellButton variant="desktop" />
              <FastAccountMenu variant="navbar" />
            </div>

            <div className="col-start-2 flex items-center gap-1.5 justify-self-end sm:gap-2 xl:hidden">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <NotificationBellButton variant="mobile" />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)] text-[var(--app-text)] transition-colors duration-200 hover:bg-[var(--app-surface-soft)] active:scale-95 sm:h-11 sm:w-11 sm:rounded-2xl"
                onClick={toggleMenu}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <span className="flex flex-col gap-1.5">
                    <span className="block h-0.5 w-5 rounded-full bg-current sm:w-6" />
                    <span className="block h-0.5 w-5 rounded-full bg-current sm:w-6" />
                    <span className="block h-0.5 w-5 rounded-full bg-current sm:w-6" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {isOpen && (
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={closeMobileMenu}
              className="fixed inset-0 z-[-1] bg-transparent xl:hidden"
            />
          )}

          <div
            className="ui-collapse xl:hidden"
            data-state={isOpen ? "open" : "closed"}
            aria-hidden={!isOpen}
            inert={!isOpen}
          >
            <div>
              <div className="px-4 pb-4">
                <div className="app-mobile-menu rounded-3xl border p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between rounded-2xl bg-blue-50/60 px-4 py-2 sm:hidden">
                      <span className="text-sm font-extrabold text-slate-700">
                        Tema tampilan
                      </span>
                      <ThemeToggle />
                    </div>
                    {mainLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <SafeNavLink
                          href={item.href}
                          key={item.href}
                          onNavigate={closeMobileMenu}
                          className={mobileLinkClass(item.href)}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white">
                            <Icon className="h-4 w-4" />
                          </span>
                          {item.label}
                        </SafeNavLink>
                      );
                    })}

                    <div className="rounded-2xl bg-blue-50/60">
                      <button
                        type="button"
                        onClick={() => setIsTentangOpen((prev) => !prev)}
                        aria-expanded={isTentangOpen}
                        className={`app-mobile-link ui-pressable flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-extrabold ${
                          isAboutActive ? "app-mobile-link-active" : ""
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              isAboutActive
                                ? "bg-white/20"
                                : "bg-white text-blue-700"
                            }`}
                          >
                            <FiGrid className="h-4 w-4" />
                          </span>
                          Tentang
                        </span>

                        <RiArrowDropDownLine className="ui-chevron h-7 w-7" />
                      </button>

                      <div
                        className="ui-collapse"
                        data-state={isTentangOpen ? "open" : "closed"}
                        inert={!isTentangOpen}
                      >
                        <div>
                          <div className="flex flex-col gap-1 px-2 pb-2 pt-1">
                            {visibleAboutLinks.map((item) => {
                              const Icon = item.icon;

                              return (
                                <SafeNavLink
                                  href={item.href}
                                  key={item.href}
                                  onNavigate={closeMobileMenu}
                                  className={mobileLinkClass(item.href)}
                                >
                                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  {item.label}
                                </SafeNavLink>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <FastAccountMenu
                      variant="mobile"
                      onNavigate={closeMobileMenu}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
