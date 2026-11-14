"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useRealtimeBroadcast } from "@/libs/realtime/useRealtimeBroadcast";

export default function SessionAutoSync() {
  const router = useRouter();
  const { status, update } = useSession();
  const isSyncingRef = useRef(false);

  const syncSession = useCallback(async () => {
    if (status !== "authenticated" || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const refreshed = await update();
      if (refreshed?.user && "isActive" in refreshed.user && refreshed.user.isActive === false) {
        await signOut({ redirect: false });
        window.location.replace("/login");
        return;
      }
      router.refresh();
    } finally {
      isSyncingRef.current = false;
    }
  }, [router, status, update]);

  useRealtimeBroadcast<{ changed: boolean }>(
    status === "authenticated" ? "markasti-auth" : null,
    "session-invalidated",
    () => { void syncSession(); },
  );

  return null;
}
