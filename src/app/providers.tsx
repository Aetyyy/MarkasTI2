"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import SessionAutoSync from "@/components/auth/sessionAutoSync";
import PresenceHeartbeat from "@/components/presence/presenceHeartbeat";
import GlobalChat from "@/components/chat/globalChat";
import NotificationManager from "@/components/notifications/notificationManager";
import ThemeProvider from "@/components/theme/themeProvider";
import MotionRuntime from "@/components/animations/motionRuntime";
import DesktopSmoothScroll from "@/components/scroll/desktopSmoothScroll";
import FeedbackToaster from "@/components/feedback/feedbackToaster";
import { SWRConfig } from "swr";
import { apiFetcher } from "@/libs/api/client";

export default function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <ThemeProvider>
      <SWRConfig
        value={{
          fetcher: apiFetcher,
          dedupingInterval: 5_000,
          focusThrottleInterval: 8_000,
          revalidateOnFocus: true,
          revalidateOnReconnect: true,
          shouldRetryOnError: true,
          errorRetryCount: 2,
        }}
      >
        <SessionProvider
          session={session}
          refetchOnWindowFocus={false}
          refetchWhenOffline={false}
        >
          <MotionRuntime>
            <DesktopSmoothScroll />
            <PresenceHeartbeat />
            <SessionAutoSync />
            {children}
            <FeedbackToaster />
            <NotificationManager />
            <GlobalChat />
          </MotionRuntime>
        </SessionProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
