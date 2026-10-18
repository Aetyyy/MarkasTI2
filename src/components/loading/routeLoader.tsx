"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FiCheck,
  FiCpu,
  FiDatabase,
  FiImage,
  FiTerminal,
} from "react-icons/fi";

type LoadingPhase = "idle" | "route" | "data" | "assets" | "done";

type AssetProgress = {
  total: number;
  loaded: number;
};

function isInternalNavigation(anchor: HTMLAnchorElement) {
  if (!anchor.href) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const url = new URL(anchor.href);
  const current = new URL(window.location.href);

  if (url.origin !== current.origin) return false;

  const onlyHashChange =
    url.pathname === current.pathname &&
    url.search === current.search &&
    url.hash !== current.hash;

  if (onlyHashChange) return false;

  const sameUrl =
    url.pathname === current.pathname &&
    url.search === current.search &&
    url.hash === current.hash;

  if (sameUrl) return false;

  return true;
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function isTrackableImage(image: HTMLImageElement) {
  const src = image.currentSrc || image.src;

  if (!src) return false;

  const rect = image.getBoundingClientRect();

  const isNearViewport =
    rect.bottom >= -400 &&
    rect.top <= window.innerHeight + 900 &&
    rect.right >= -400 &&
    rect.left <= window.innerWidth + 400;

  const isEager = image.loading === "eager";
  const isPriority = image.getAttribute("fetchpriority") === "high";

  return isNearViewport || isEager || isPriority;
}

async function waitForImage(image: HTMLImageElement) {
  if (image.complete) {
    if (image.naturalWidth > 0 && "decode" in image) {
      try {
        await image.decode();
      } catch {
        // decode gagal tetap dianggap selesai agar loading tidak stuck
      }
    }

    return;
  }

  await new Promise<void>((resolve) => {
    const done = () => resolve();

    image.addEventListener("load", done, {
      once: true,
    });

    image.addEventListener("error", done, {
      once: true,
    });
  });

  if (image.naturalWidth > 0 && "decode" in image) {
    try {
      await image.decode();
    } catch {
      // abaikan
    }
  }
}

function getFetchUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;

  if (input instanceof URL) return input.href;

  return input.url;
}

function shouldTrackFetch(input: RequestInfo | URL) {
  const url = getFetchUrl(input);

  if (!url) return false;

  if (url.includes("/api/realtime/")) return false;
  if (url.includes("/api/gallery/download")) return false;
  if (url.startsWith("data:")) return false;
  if (url.startsWith("blob:")) return false;

  return true;
}

function getPercent(loaded: number, total: number) {
  if (total <= 0) return 0;

  return Math.min(100, Math.round((loaded / total) * 100));
}

function StatusIcon({
  active,
  done,
  type,
}: {
  active: boolean;
  done: boolean;
  type: "route" | "data" | "assets";
}) {
  if (done) {
    return <FiCheck className="h-6 w-6" />;
  }

  if (type === "route") {
    return (
      <FiTerminal className={`h-6 w-6 ${active ? "animate-pulse" : ""}`} />
    );
  }

  if (type === "data") {
    return (
      <FiDatabase className={`h-6 w-6 ${active ? "animate-pulse" : ""}`} />
    );
  }

  return <FiImage className={`h-6 w-6 ${active ? "animate-pulse" : ""}`} />;
}

function LoadingCard({
  title,
  description,
  active,
  done,
  type,
  total,
  loaded,
}: {
  title: string;
  description: string;
  active: boolean;
  done: boolean;
  type: "route" | "data" | "assets";
  total?: number;
  loaded?: number;
}) {
  const percent =
    typeof total === "number" && typeof loaded === "number"
      ? getPercent(loaded, total)
      : done
        ? 100
        : active
          ? 45
          : 0;

  return (
    <div
      className={`rounded-2xl border p-4 text-[var(--app-text)] transition ${
        done
          ? "border-emerald-200 bg-emerald-50/80"
          : active
            ? type === "route"
              ? "border-blue-200 bg-blue-50/90"
              : type === "data"
                ? "border-cyan-200 bg-cyan-50/90"
                : "border-indigo-200 bg-indigo-50/90"
            : "border-[var(--app-border)] bg-[var(--app-surface-soft)]"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg ${
            done
              ? "bg-emerald-500"
              : active
                ? type === "route"
                  ? "bg-blue-600"
                  : type === "data"
                    ? "bg-cyan-500"
                    : "bg-indigo-500"
                : "bg-[var(--app-surface-muted)] text-[var(--app-muted)] shadow-none"
          }`}
        >
          <StatusIcon active={active} done={done} type={type} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-900">{title}</p>

            {typeof total === "number" && total > 0 && (
              <p className="shrink-0 text-xs font-black text-slate-400">
                {loaded}/{total}
              </p>
            )}
          </div>

          <p className="mt-1 text-xs font-bold text-slate-500">
            {done ? "Selesai." : description}
          </p>

          <div
            className={`mt-3 h-2 overflow-hidden rounded-full ${
              type === "route"
                ? "bg-blue-100"
                : type === "data"
                  ? "bg-cyan-100"
                  : "bg-indigo-100"
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                done
                  ? "bg-emerald-500"
                  : active
                    ? type === "route"
                      ? "loading-indeterminate bg-blue-600"
                      : type === "data"
                        ? "bg-cyan-500"
                        : "bg-indigo-500"
                    : "bg-[var(--app-border)]"
              }`}
              style={{
                width:
                  active && type === "route" && !done ? "45%" : `${percent}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RouteLoadingProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const routeKey = useMemo(() => {
    return `${pathname}?${searchParams.toString()}`;
  }, [pathname, searchParams]);

  const firstRender = useRef(true);
  const activeLoadId = useRef(0);
  const visibleRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const pendingDataRef = useRef(0);
  const dataWaitersRef = useRef<Set<() => void>>(new Set());

  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<LoadingPhase>("idle");

  const [routeDone, setRouteDone] = useState(false);
  const [dataDone, setDataDone] = useState(false);
  const [assetsDone, setAssetsDone] = useState(false);

  const [dataProgress, setDataProgress] = useState<AssetProgress>({
    total: 0,
    loaded: 0,
  });

  const [assetProgress, setAssetProgress] = useState<AssetProgress>({
    total: 0,
    loaded: 0,
  });

  function setVisibleSafe(nextVisible: boolean) {
    visibleRef.current = nextVisible;
    setVisible(nextVisible);
  }

  function resetProgress() {
    setRouteDone(false);
    setDataDone(false);
    setAssetsDone(false);

    setDataProgress({
      total: 0,
      loaded: 0,
    });

    setAssetProgress({
      total: 0,
      loaded: 0,
    });
  }

  function clearFallbackTimer() {
    if (fallbackTimerRef.current === null) return;

    window.clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  }

  function resolveDataWaiters() {
    pendingDataRef.current = 0;
    dataWaitersRef.current.forEach((resolve) => resolve());
    dataWaitersRef.current.clear();
  }

  function forceStopLoading() {
    activeLoadId.current += 1;
    clearFallbackTimer();
    resolveDataWaiters();
    setVisibleSafe(false);
    setPhase("idle");
    resetProgress();
  }

  function scheduleFallback(loadId: number) {
    clearFallbackTimer();

    fallbackTimerRef.current = window.setTimeout(() => {
      if (activeLoadId.current !== loadId) return;

      finishLoading(loadId);
    }, 5200);
  }

  function startLoading() {
    activeLoadId.current += 1;
    startedAtRef.current = performance.now();

    resetProgress();
    setPhase("route");
    setVisibleSafe(true);
    scheduleFallback(activeLoadId.current);
  }

  function finishLoading(loadId: number) {
    if (activeLoadId.current !== loadId) return;

    clearFallbackTimer();
    setRouteDone(true);
    setDataDone(true);
    setAssetsDone(true);
    setPhase("done");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (activeLoadId.current !== loadId) return;

        setVisibleSafe(false);
        setPhase("idle");
        resetProgress();
      });
    });
  }

  function notifyDataStart() {
    pendingDataRef.current += 1;

    if (visibleRef.current) {
      setDataProgress((prev) => ({
        total: prev.total + 1,
        loaded: prev.loaded,
      }));
    }
  }

  function notifyDataEnd() {
    pendingDataRef.current = Math.max(0, pendingDataRef.current - 1);

    if (visibleRef.current) {
      setDataProgress((prev) => ({
        total: Math.max(prev.total, prev.loaded + 1),
        loaded: prev.loaded + 1,
      }));
    }

    if (pendingDataRef.current === 0) {
      dataWaitersRef.current.forEach((resolve) => resolve());
      dataWaitersRef.current.clear();
    }
  }

  function waitForDataTasks() {
    if (pendingDataRef.current === 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      dataWaitersRef.current.add(resolve);
    });
  }

  async function waitForAssets(loadId: number) {
    await waitForNextPaint();

    if (activeLoadId.current !== loadId) return;

    const trackedImages = Array.from(document.images).filter(isTrackableImage);

    const uniqueImages = Array.from(
      new Map(
        trackedImages.map((image) => [image.currentSrc || image.src, image]),
      ).values(),
    );

    const hasFonts = "fonts" in document && document.fonts.status !== "loaded";

    const totalAssets = uniqueImages.length + (hasFonts ? 1 : 0);

    setAssetProgress({
      total: totalAssets,
      loaded: 0,
    });

    if (totalAssets === 0) return;

    let loadedAssets = 0;

    function markLoaded() {
      loadedAssets += 1;

      setAssetProgress({
        total: totalAssets,
        loaded: loadedAssets,
      });
    }

    const tasks: Promise<void>[] = [];

    if (hasFonts) {
      tasks.push(
        document.fonts.ready
          .then(() => {
            markLoaded();
          })
          .catch(() => {
            markLoaded();
          }),
      );
    }

    uniqueImages.forEach((image) => {
      tasks.push(
        waitForImage(image)
          .then(() => {
            markLoaded();
          })
          .catch(() => {
            markLoaded();
          }),
      );
    });

    await Promise.allSettled(tasks);
  }

  useEffect(() => {
    const originalFetch = window.fetch;
    const callOriginalFetch = originalFetch.bind(window);
    const trackedPreconnect: typeof originalFetch.preconnect = (...args) => {
      const preconnect = originalFetch.preconnect;

      if (typeof preconnect === "function") {
        return preconnect.apply(originalFetch, args);
      }
    };

    const trackedFetch = Object.assign(
      async (...args: Parameters<typeof window.fetch>) => {
        const shouldTrack = shouldTrackFetch(args[0]);

        if (shouldTrack) {
          notifyDataStart();
        }

        try {
          return await callOriginalFetch(...args);
        } finally {
          if (shouldTrack) {
            notifyDataEnd();
          }
        }
      },
      { preconnect: trackedPreconnect },
    );

    window.fetch = trackedFetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor) return;
      if (!isInternalNavigation(anchor)) return;

      startLoading();
    }

    function handlePopState() {
      startLoading();
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted || visibleRef.current) {
        forceStopLoading();
      }
    }

    function handlePageHide() {
      forceStopLoading();
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (!visibleRef.current) return;
      if (performance.now() - startedAtRef.current < 900) return;

      forceStopLoading();
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearFallbackTimer();
    };
    // Listener dipasang sekali; startLoading membaca state melalui ref internal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (!visibleRef.current) {
      activeLoadId.current += 1;
      startedAtRef.current = performance.now();
      resetProgress();
      setVisibleSafe(true);
    }

    const loadId = activeLoadId.current;
    scheduleFallback(loadId);

    setRouteDone(true);
    setPhase("data");

    let cancelled = false;

    async function runLoadingFlow() {
      await waitForDataTasks();

      if (cancelled || activeLoadId.current !== loadId) return;

      setDataDone(true);
      setPhase("assets");

      await waitForAssets(loadId);

      if (cancelled || activeLoadId.current !== loadId) return;

      setAssetsDone(true);
      finishLoading(loadId);
    }

    void runLoadingFlow();

    return () => {
      cancelled = true;
    };
    // Alur harus diulang hanya ketika route berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  if (!visible) return null;

  const currentLabel =
    phase === "route"
      ? "Compiling interface"
      : phase === "data"
        ? "Loading page data"
        : phase === "assets"
          ? "Syncing page assets"
          : phase === "done"
            ? "Page ready"
            : "Preparing page";

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[var(--app-bg)] px-4 text-[var(--app-text)]">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-7 shadow-[var(--app-shadow)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--app-accent-soft)] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="grid h-24 w-24 place-items-center rounded-[1.7rem] bg-blue-600 text-white shadow-xl shadow-blue-600/25">
            <FiCpu className="h-12 w-12" />
          </div>

          <h2 className="mt-7 text-3xl font-black tracking-tight text-[var(--app-text)]">
            MarkasTI
          </h2>

          <p className="mt-2 text-xs font-black uppercase tracking-[0.45em] text-blue-600">
            Loading Route
          </p>
        </div>

        <div className="relative z-10 mt-8 space-y-4">
          <LoadingCard
            title="Compiling interface"
            description="Menunggu halaman baru selesai dirender..."
            active={phase === "route"}
            done={routeDone}
            type="route"
          />

          <LoadingCard
            title="Loading page data"
            description="Menunggu request data halaman selesai..."
            active={phase === "data"}
            done={dataDone}
            type="data"
            total={dataProgress.total}
            loaded={dataProgress.loaded}
          />

          <LoadingCard
            title="Syncing page assets"
            description="Memuat gambar dan font yang dibutuhkan halaman..."
            active={phase === "assets"}
            done={assetsDone}
            type="assets"
            total={assetProgress.total}
            loaded={assetProgress.loaded}
          />
        </div>

        <div className="relative z-10 mt-7 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-2 text-sm font-black text-[var(--app-accent-strong)] shadow-md">
            <span
              className={`h-2 w-2 rounded-full ${
                phase === "done"
                  ? "bg-emerald-500"
                  : "animate-pulse bg-blue-600"
              }`}
            />
            {currentLabel}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loadingIndeterminate {
          0% {
            transform: translateX(-120%);
          }

          100% {
            transform: translateX(260%);
          }
        }

        .loading-indeterminate {
          width: 38% !important;
          animation: loadingIndeterminate 1.05s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
