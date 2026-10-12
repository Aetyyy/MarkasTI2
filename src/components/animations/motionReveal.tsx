"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useMotionRegistration } from "@/components/animations/motionRuntime";

export type MotionVariant =
  | "rise"
  | "slide-left"
  | "slide-right"
  | "scale"
  | "tilt";

type MotionStyle = CSSProperties & {
  "--motion-delay"?: string;
};

export default function MotionReveal({
  children,
  variant = "rise",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  variant?: MotionVariant;
  delay?: number;
  className?: string;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const register = useMotionRegistration();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (!register) {
      element.classList.add("motion-visible");
      return;
    }

    return register(element);
  }, [register]);

  return (
    <div
      ref={elementRef}
      data-motion={variant}
      data-motion-delay={delay}
      className={className}
      style={{ "--motion-delay": `${Math.max(0, delay)}ms` } as MotionStyle}
    >
      {children}
    </div>
  );
}
