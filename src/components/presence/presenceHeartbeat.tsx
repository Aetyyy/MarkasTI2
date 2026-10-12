"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePresenceRevalidation } from "@/components/presence/usePresence";

export default function PresenceHeartbeat() {
  const { data: session, status } = useSession();
  const intervalRef = useRef<number | null>(null);
  const revalidatePresence = usePresenceRevalidation();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user?.id) return;

    let active = true;

    const sendOnline = async () => {
      if (!active) return;

      try {
        const response = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ONLINE" }),
          cache: "no-store",
        });

        if (response.ok) {
          await revalidatePresence();
        }
      } catch {
        // Abaikan error presence.
      }
    };

    sendOnline();

    intervalRef.current = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        sendOnline();
      }
    }, 25000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sendOnline();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [revalidatePresence, session?.user?.id, status]);

  return null;
}
