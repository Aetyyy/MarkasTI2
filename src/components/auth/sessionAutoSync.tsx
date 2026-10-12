"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function SessionAutoSync() {
  const router = useRouter();
  const { status, update } = useSession();

  const eventSourceRef = useRef<EventSource | null>(null);
  const isSyncingRef = useRef(false);

  const syncSession = useCallback(async (refreshRoute = false) => {
    if (status !== "authenticated") return;
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;

    try {
      await update();
      if (refreshRoute) router.refresh();
    } finally {
      isSyncingRef.current = false;
    }
  }, [router, status, update]);

  const syncSessionRef = useRef(syncSession);
  syncSessionRef.current = syncSession;

  useEffect(() => {
    if (status !== "authenticated") {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return;
    }

    if (eventSourceRef.current) return;

    const eventSource = new EventSource("/api/realtime/auth");
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("auth-session-changed", () => {
      void syncSessionRef.current(true);
    });

    eventSource.addEventListener("auth-force-logout", async () => {
      await signOut({
        redirect: false,
      });

      window.location.replace("/login");
    });

    // EventSource reconnects automatically. Do not close/recreate it for
    // transient network errors; that caused repeated auth subscriptions.

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [status]);

  return null;
}
