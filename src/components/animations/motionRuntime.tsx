"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

type RegisterMotion = (element: HTMLElement) => () => void;

const MotionContext = createContext<RegisterMotion | null>(null);

export function useMotionRegistration() {
  return useContext(MotionContext);
}

export default function MotionRuntime({ children }: { children: ReactNode }) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const register = useCallback<RegisterMotion>((element) => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      element.classList.add("motion-visible");
      return () => undefined;
    }

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries, observer) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("motion-visible");
            observer.unobserve(entry.target);
          }
        },
        {
          threshold: 0.08,
          rootMargin: "0px 0px -5% 0px",
        },
      );
    }

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.unobserve(element);
    };
  }, []);

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    },
    [],
  );

  return (
    <MotionContext.Provider value={register}>
      {children}
    </MotionContext.Provider>
  );
}
