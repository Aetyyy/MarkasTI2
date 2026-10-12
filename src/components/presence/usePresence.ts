"use client";

import useSWR, { useSWRConfig } from "swr";
import { useCallback } from "react";

export type PresenceEntry = {
  id: string;
  nim: string;
  status: "ONLINE" | "OFFLINE";
  lastSeenAt: string | null;
};

type PresenceResponse = {
  ok: boolean;
  data: PresenceEntry[];
};

export function usePresence(refreshInterval = 20_000) {
  return useSWR<PresenceResponse>("/api/presence", {
    refreshInterval,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}

export function usePresenceRevalidation() {
  const { mutate } = useSWRConfig();

  return useCallback(() => mutate("/api/presence"), [mutate]);
}
