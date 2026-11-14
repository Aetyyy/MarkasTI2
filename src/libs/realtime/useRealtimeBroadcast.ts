"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getRealtimeClient } from "@/libs/realtime/supabaseClient";

export function useRealtimeBroadcast<T>(
  topic: string | null,
  event: string,
  onEvent: (payload: T) => void,
  onStatus?: (connected: boolean) => void,
) {
  const callbackRef = useRef(onEvent);
  const statusRef = useRef(onStatus);
  const lastDispatchRef = useRef(0);
  useLayoutEffect(() => {
    callbackRef.current = onEvent;
    statusRef.current = onStatus;
  }, [onEvent, onStatus]);

  useEffect(() => {
    if (!topic) return;
    let active = true;
    let channel: RealtimeChannel | null = null;
    void getRealtimeClient().then((client) => {
      if (!active || !client) return;
      channel = client.channel(topic).on("broadcast", { event }, ({ payload }) => {
        const now = Date.now();
        if (now - lastDispatchRef.current < 1000) return;
        lastDispatchRef.current = now;
        callbackRef.current(payload as T);
      }).subscribe((status) => statusRef.current?.(status === "SUBSCRIBED"));
    });
    return () => {
      active = false;
      statusRef.current?.(false);
      if (channel) void getRealtimeClient().then((client) => {
        const activeChannel = channel;
        if (activeChannel) return client?.removeChannel(activeChannel);
      });
    };
  }, [event, topic]);
}
