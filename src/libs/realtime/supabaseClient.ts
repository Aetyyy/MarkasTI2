"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getRealtimeClient(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise = fetch("/api/realtime/config", { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) return null;
        const config = (await response.json()) as { ok?: boolean; url?: string; key?: string };
        if (!config.ok || !config.url || !config.key) return null;
        return createClient(config.url, config.key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          realtime: { params: { eventsPerSecond: 10 } },
        });
      })
      .catch(() => null);
  }
  return clientPromise;
}
