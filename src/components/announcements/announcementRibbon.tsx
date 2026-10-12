"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FiArrowRight, FiBell, FiX } from "react-icons/fi";

type Announcement = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  publishedAt: string | null;
};

const GUEST_DISMISS_KEY = "markasti-announcement-dismissed-until";

export default function AnnouncementRibbon() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (/^\/(login|signin|auth)(\/|$)/i.test(pathname)) return;
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/announcements", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as { data?: Announcement[] };
        if (active) setAnnouncement(result.data?.[0] || null);
      } catch {
        // Pengumuman aktif yang sudah termuat tetap tampil saat jaringan terputus.
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [pathname]);

  useEffect(() => {
    if (!announcement || status === "loading") return;
    const timer = window.setTimeout(() => {
      try {
        if (status === "authenticated" && session?.user?.id) {
          setDismissed(localStorage.getItem(`markasti-announcement-${session.user.id}`) === announcement.id);
        } else {
          const stored = localStorage.getItem(GUEST_DISMISS_KEY);
          const value = stored ? JSON.parse(stored) as { id?: string; until?: number } : null;
          setDismissed(value?.id === announcement.id && Number(value.until) > Date.now());
        }
      } catch {
        setDismissed(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [announcement, session?.user?.id, status]);

  if (!announcement || dismissed || /^\/(login|signin|auth|admin)(\/|$)/i.test(pathname)) return null;
  const activeAnnouncement = announcement;

  function dismiss() {
    try {
      if (status === "authenticated" && session?.user?.id) {
        localStorage.setItem(`markasti-announcement-${session.user.id}`, activeAnnouncement.id);
      } else {
        localStorage.setItem(GUEST_DISMISS_KEY, JSON.stringify({ id: activeAnnouncement.id, until: Date.now() + 60 * 60 * 1000 }));
      }
    } catch {
      // Banner tetap bisa ditutup selama sesi halaman ini.
    }
    setDismissed(true);
  }

  return (
    <aside className="announcementRibbon" aria-label="Pengumuman terbaru">
      <span className="announcementRibbon-label"><FiBell /> Pengumuman</span>
      <div className="announcementRibbon-window">
        <div className="announcementRibbon-track">
          {[0, 1].map((copy) => (
            <span className="announcementRibbon-copy" key={copy} aria-hidden={copy === 1}>
              <strong>{activeAnnouncement.title}</strong><span>{activeAnnouncement.body}</span>
              <span className="announcementRibbon-dot" />
            </span>
          ))}
        </div>
      </div>
      <Link className="announcementRibbon-link" href={activeAnnouncement.url || "/announcements"}>
        Baca <FiArrowRight />
      </Link>
      <button className="announcementRibbon-close" type="button" onClick={dismiss} aria-label="Tutup pengumuman"><FiX /></button>
    </aside>
  );
}
