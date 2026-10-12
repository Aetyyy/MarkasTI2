"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FiArrowRight,
  FiBell,
  FiBellOff,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { confirmDanger, showError } from "@/libs/swal";

type RealtimeNotification = {
  type?: "notification" | "task" | "schedule" | "gallery" | "announcement";
  title: string;
  body: string;
  url?: string;
  referenceId?: string;
  tag?: string;
};

type InboxNotification = RealtimeNotification & {
  id: string;
  readAt: string | null;
  createdAt: string;
};

const PUSH_PROMPT_DISMISSED_KEY = "markasti-push-prompt-dismissed";
const PUSH_LAST_VISIT_KEY = "markasti-push-last-visit";
const PUSH_PROMPT_COOLDOWN = 24 * 60 * 60 * 1000;

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(result?.message || "Subscription gagal disimpan.");
  }
}

export default function NotificationManager() {
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushInitialized, setPushInitialized] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [promptReady, setPromptReady] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<RealtimeNotification | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inbox, setInbox] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const toastTimer = useRef<number | null>(null);
  const recentlySeen = useRef(new Map<string, number>());

  const loadInbox = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const result = (await response.json()) as {
        ok: boolean;
        data: InboxNotification[];
        unreadCount: number;
      };
      if (result.ok) {
        setInbox(result.data);
        setUnreadCount(result.unreadCount);
      }
    } catch {
      // Realtime tetap dapat dipakai saat riwayat sementara tidak tersedia.
    }
  }, []);

  const showInAppNotification = useCallback(
    (payload: RealtimeNotification) => {
      const key = `${payload.type || "notification"}:${
        payload.referenceId || payload.tag || payload.title
      }:${payload.body}`;
      const now = Date.now();
      const previous = recentlySeen.current.get(key) || 0;
      if (now - previous < 3000) return;
      recentlySeen.current.set(key, now);

      setToast(payload);
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 8000);
      void loadInbox();
    },
    [loadInbox],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted || status !== "authenticated") return;
    const timer = window.setTimeout(() => {
      try {
        const now = Date.now();
        const lastVisit = Number(
          window.localStorage.getItem(PUSH_LAST_VISIT_KEY),
        );
        const wasDismissed =
          window.localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY) === "1";
        const returningAfterCooldown =
          Number.isFinite(lastVisit) && now - lastVisit >= PUSH_PROMPT_COOLDOWN;

        setDismissedPrompt(wasDismissed && !returningAfterCooldown);
        window.localStorage.setItem(PUSH_LAST_VISIT_KEY, String(now));
        if (returningAfterCooldown) {
          window.localStorage.removeItem(PUSH_PROMPT_DISMISSED_KEY);
        }
      } catch {
        setDismissedPrompt(false);
      } finally {
        setPromptReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [mounted, status]);

  useEffect(() => {
    if (!mounted || status !== "authenticated") return;
    let active = true;

    async function initializePush() {
      const available =
        window.isSecureContext &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!active) return;
      setPushSupported(available);
      void loadInbox();

      if (!available) {
        setPushEnabled(false);
        setPushInitialized(true);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        void registration.update().catch(() => undefined);
        const subscription = await registration.pushManager.getSubscription();
        if (!active) return;

        if (Notification.permission === "granted" && subscription) {
          await saveSubscription(subscription);
          if (active) setPushEnabled(true);
        } else {
          setPushEnabled(false);
        }
      } catch (cause) {
        if (!active) return;
        setPushEnabled(false);
        setError(
          cause instanceof Error
            ? cause.message
            : "Service worker notifikasi gagal disiapkan.",
        );
      } finally {
        if (active) setPushInitialized(true);
      }
    }

    void initializePush();
    return () => {
      active = false;
    };
  }, [loadInbox, mounted, status]);

  useEffect(() => {
    if (!mounted || status !== "authenticated") return;

    window.dispatchEvent(
      new CustomEvent("markasti:notification-state", {
        detail: { unreadCount, open: inboxOpen },
      }),
    );
  }, [inboxOpen, mounted, status, unreadCount]);

  useEffect(() => {
    if (!mounted || status !== "authenticated") return;

    const toggle = () => {
      setInboxOpen((current) => {
        if (!current) void loadInbox();
        return !current;
      });
    };
    window.addEventListener("markasti:toggle-notifications", toggle);
    return () =>
      window.removeEventListener("markasti:toggle-notifications", toggle);
  }, [loadInbox, mounted, status]);

  useEffect(() => {
    if (!mounted || status !== "authenticated") return;

    const source = new EventSource("/api/realtime/notifications");
    source.addEventListener("connected", () => setRealtimeConnected(true));
    source.addEventListener("notification", (event) => {
      try {
        showInAppNotification(
          JSON.parse((event as MessageEvent).data) as RealtimeNotification,
        );
      } catch {
        // Event rusak diabaikan agar EventSource dapat melanjutkan koneksi.
      }
    });
    source.onerror = () => setRealtimeConnected(false);

    const serviceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "MARKASTI_PUSH" && event.data.payload) {
        showInAppNotification(event.data.payload as RealtimeNotification);
      }
    };
    navigator.serviceWorker?.addEventListener("message", serviceWorkerMessage);

    return () => {
      source.close();
      navigator.serviceWorker?.removeEventListener(
        "message",
        serviceWorkerMessage,
      );
      setRealtimeConnected(false);
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, [mounted, showInAppNotification, status]);

  useEffect(() => {
    if (!mounted || status !== "authenticated") return;

    const refresh = () => {
      if (document.visibilityState === "visible") void loadInbox();
    };
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadInbox, mounted, status]);

  const enablePush = useCallback(async () => {
    if (pushBusy || !pushSupported) return;
    setPushBusy(true);
    setError("");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(
          permission === "denied"
            ? "Notifikasi diblokir. Izinkan kembali melalui pengaturan situs browser."
            : "Izin notifikasi belum diberikan.",
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const keyResponse = await fetch("/api/push/public-key", {
        cache: "no-store",
      });
      const keyResult = (await keyResponse.json()) as {
        ok?: boolean;
        publicKey?: string;
      };
      if (!keyResponse.ok || !keyResult.publicKey) {
        throw new Error("VAPID public key belum dikonfigurasi.");
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyResult.publicKey),
        });
      }

      await saveSubscription(subscription);
      setPushEnabled(true);
      setDismissedPrompt(true);
      window.localStorage.removeItem(PUSH_PROMPT_DISMISSED_KEY);
      await loadInbox();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setPushEnabled(false);
      setError(
        /abort|registration failed|push service/i.test(message)
          ? "Layanan push browser gagal mendaftarkan perangkat. Coba matikan pemblokir, pastikan koneksi aktif, lalu muat ulang halaman."
          : message || "Web push belum dapat diaktifkan pada browser ini.",
      );
    } finally {
      setPushBusy(false);
    }
  }, [loadInbox, pushBusy, pushSupported]);

  const disablePush = useCallback(async () => {
    if (pushBusy || !pushSupported) return;
    setPushBusy(true);
    setError("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setPushEnabled(false);
      setDismissedPrompt(true);
      window.localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "1");
      window.localStorage.setItem(PUSH_LAST_VISIT_KEY, String(Date.now()));
    } catch {
      setError(
        "Web push gagal dinonaktifkan. Silakan muat ulang dan coba lagi.",
      );
    } finally {
      setPushBusy(false);
    }
  }, [pushBusy, pushSupported]);

  useEffect(() => {
    if (!mounted || status !== "authenticated") return;

    const detail = {
      supported: pushSupported,
      enabled: pushEnabled,
      initialized: pushInitialized,
      busy: pushBusy,
      error,
    };
    const publish = () =>
      window.dispatchEvent(
        new CustomEvent("markasti:push-state", { detail }),
      );
    const enable = () => void enablePush();
    const disable = () => void disablePush();

    publish();
    window.addEventListener("markasti:request-push-state", publish);
    window.addEventListener("markasti:enable-push", enable);
    window.addEventListener("markasti:disable-push", disable);
    return () => {
      window.removeEventListener("markasti:request-push-state", publish);
      window.removeEventListener("markasti:enable-push", enable);
      window.removeEventListener("markasti:disable-push", disable);
    };
  }, [
    error,
    disablePush,
    enablePush,
    mounted,
    pushBusy,
    pushEnabled,
    pushInitialized,
    pushSupported,
    status,
  ]);

  async function markRead(id: string) {
    const item = inbox.find((entry) => entry.id === id);
    if (!item || item.readAt) return;
    const readAt = new Date().toISOString();
    setInbox((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, readAt } : entry)),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => undefined);
  }

  function handleNotificationNavigation(url?: string) {
    if (url?.includes("chat=open")) {
      window.dispatchEvent(new Event("markasti:open-chat"));
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) return;
    const readAt = new Date().toISOString();
    setInbox((current) => current.map((entry) => ({ ...entry, readAt })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => undefined);
  }

  async function deleteNotification(id: string) {
    const current = inbox.find((entry) => entry.id === id);
    if (!current) return;

    setInbox((items) => items.filter((entry) => entry.id !== id));
    if (!current.readAt) {
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Notifikasi gagal dihapus.");
    } catch (cause) {
      await loadInbox();
      await showError(
        "Gagal menghapus notifikasi",
        cause instanceof Error ? cause.message : "Silakan coba lagi.",
      );
    }
  }

  async function deleteAllNotifications() {
    if (inbox.length === 0) return;
    const confirmed = await confirmDanger(
      "Hapus semua notifikasi?",
      "Seluruh riwayat notifikasi pada akunmu akan dihapus permanen.",
    );
    if (!confirmed) return;

    const previous = inbox;
    const previousUnread = unreadCount;
    setInbox([]);
    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!response.ok) throw new Error("Riwayat notifikasi gagal dibersihkan.");
    } catch (cause) {
      setInbox(previous);
      setUnreadCount(previousUnread);
      await showError(
        "Gagal membersihkan notifikasi",
        cause instanceof Error ? cause.message : "Silakan coba lagi.",
      );
    }
  }

  if (!mounted || status !== "authenticated") return null;

  const showPushPrompt =
    promptReady &&
    pushInitialized &&
    pushSupported &&
    !pushEnabled &&
    !dismissedPrompt;

  return (
    <div className="pointer-events-none fixed right-3 top-24 z-[119] flex w-[min(24rem,calc(100vw-1.5rem))] flex-col items-end gap-3 sm:right-6">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl shadow-blue-950/20"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
              <FiBell />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-black text-slate-950">{toast.title}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                {toast.body}
              </p>
              {toast.url && (
                <Link
                  href={toast.url}
                  onClick={() => {
                    handleNotificationNavigation(toast.url);
                    setToast(null);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blue-700"
                >
                  Lihat detail <FiArrowRight />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 transition hover:text-slate-700"
              aria-label="Tutup notifikasi"
            >
              <FiX />
            </button>
          </div>
        </div>
      )}

      {inboxOpen && (
        <section className="pointer-events-auto max-h-[min(70vh,38rem)] w-full overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/20">
          <header className="border-b border-slate-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-950">Notifikasi</h2>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  {realtimeConnected ? "" : "Menghubungkan realtime..."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="rounded-lg px-2 py-1 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50"
                  >
                    Baca semua
                  </button>
                )}
                {inbox.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void deleteAllNotifications()}
                    aria-label="Hapus semua notifikasi"
                    title="Hapus semua"
                    className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                  >
                    <FiTrash2 />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInboxOpen(false)}
                  aria-label="Tutup inbox notifikasi"
                  className="rounded-full bg-slate-100 p-2 text-slate-500"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <Link
              href="/settings#notifications"
              onClick={() => setInboxOpen(false)}
              className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-blue-50 p-3 text-xs font-black text-blue-700 transition hover:bg-blue-100"
            >
              <span className="inline-flex items-center gap-2">
                <FiBellOff />
                Pengaturan notifikasi
              </span>
              <FiArrowRight />
            </Link>
          </header>

          <div className="max-h-[24rem] overflow-y-auto p-2">
            {inbox.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FiBell className="mx-auto h-8 w-8 text-blue-200" />
                <p className="mt-3 text-sm font-black text-slate-700">
                  Belum ada notifikasi
                </p>
              </div>
            ) : (
              inbox.map((item) => (
                <article
                  key={item.id}
                  className={`group flex items-start gap-1 rounded-2xl transition hover:bg-blue-50 ${item.readAt ? "opacity-70" : "bg-blue-50/60"}`}
                >
                  <Link
                    href={item.url || "#"}
                    onClick={() => {
                      handleNotificationNavigation(item.url);
                      void markRead(item.id);
                    }}
                    className="min-w-0 flex-1 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-slate-200" : "bg-blue-600"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500">
                          {item.body}
                        </p>
                        <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void deleteNotification(item.id)}
                    aria-label={`Hapus notifikasi ${item.title}`}
                    title="Hapus notifikasi"
                    className="mr-2 mt-2 rounded-xl p-2 text-slate-300 transition hover:bg-rose-100 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {showPushPrompt && !inboxOpen && (
        <div className="pointer-events-auto relative w-full rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white"><FiBell /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900">Aktifkan web push</p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">Notifikasi in-app selalu aktif. Web push membuat pemberitahuan tetap masuk saat website ditutup.</p>
              <Link href="/settings#notifications" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">
                <FiBell /> Buka pengaturan
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDismissedPrompt(true);
              window.localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "1");
              window.localStorage.setItem(PUSH_LAST_VISIT_KEY, String(Date.now()));
            }}
            className="absolute right-3 top-3 text-slate-400"
            aria-label="Tutup permintaan notifikasi"
          >
            <FiX />
          </button>
        </div>
      )}
    </div>
  );
}
