"use client";

import { useEffect } from "react";

const DESKTOP_QUERY =
  "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export default function DesktopSmoothScroll() {
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let destroyed = false;
    let destroyCurrent: (() => void) | undefined;

    const setup = async () => {
      destroyCurrent?.();
      destroyCurrent = undefined;

      if (!desktop.matches || reducedMotion.matches) return;

      const { default: Lenis } = await import("lenis");
      if (destroyed || !desktop.matches || reducedMotion.matches) return;

      const lenis = new Lenis({
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.115,
        wheelMultiplier: 0.88,
        overscroll: true,
        anchors: true,
        stopInertiaOnNavigate: true,
        prevent: (node) =>
          node instanceof HTMLElement &&
          Boolean(
            node.closest(
              '[data-lenis-prevent], [role="dialog"], .sidebar-light-scroll, .gallery-hidden-scroll, .ui-popover',
            ),
          ),
      });

      destroyCurrent = () => lenis.destroy();
    };

    const handlePreferenceChange = () => void setup();

    void setup();
    desktop.addEventListener("change", handlePreferenceChange);
    reducedMotion.addEventListener("change", handlePreferenceChange);

    return () => {
      destroyed = true;
      desktop.removeEventListener("change", handlePreferenceChange);
      reducedMotion.removeEventListener("change", handlePreferenceChange);
      destroyCurrent?.();
    };
  }, []);

  return null;
}
