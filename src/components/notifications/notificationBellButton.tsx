"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FiBell } from "react-icons/fi";

type NotificationState = {
  unreadCount: number;
  open: boolean;
};

export default function NotificationBellButton({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<NotificationState>({
    unreadCount: 0,
    open: false,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    const update = (event: Event) => {
      const detail = (event as CustomEvent<NotificationState>).detail;
      if (detail) setState(detail);
    };
    window.addEventListener("markasti:notification-state", update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("markasti:notification-state", update);
    };
  }, []);

  if (!mounted || status !== "authenticated") return null;

  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new Event("markasti:toggle-notifications"))
      }
      aria-label="Buka inbox notifikasi"
      aria-expanded={state.open}
      className={`relative grid shrink-0 place-items-center border border-blue-100 bg-white text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-95 ${
        variant === "mobile"
          ? "h-11 w-11 rounded-2xl"
          : "h-12 w-12 rounded-2xl"
      } ${state.open ? "ring-2 ring-blue-200" : ""}`}
    >
      <FiBell className="h-5 w-5" />
      {state.unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
          {state.unreadCount > 99 ? "99+" : state.unreadCount}
        </span>
      )}
    </button>
  );
}
