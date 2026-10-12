"use client";

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

type PopoverPlacement =
  | "bottom-end"
  | "top-start"
  | "right-start"
  | "mobile-sheet";

type PopoverPosition = {
  bottom?: number;
  left: number;
  maxHeight: number;
  top?: number;
  width: number;
  transformOrigin: string;
};

type PortalPopoverProps = {
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  open: boolean;
  onClose: () => void;
  placement?: PopoverPlacement;
};

const VIEWPORT_GAP = 12;
const ANCHOR_GAP = 10;
const EXIT_DURATION = 180;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getPosition(
  anchor: HTMLElement,
  placement: PopoverPlacement,
): PopoverPosition {
  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const useSheet = placement === "mobile-sheet" || viewportWidth < 1024;

  if (useSheet) {
    return {
      bottom: VIEWPORT_GAP,
      left: VIEWPORT_GAP,
      maxHeight: viewportHeight - VIEWPORT_GAP * 2,
      width: viewportWidth - VIEWPORT_GAP * 2,
      transformOrigin: "bottom center",
    };
  }

  if (placement === "top-start") {
    const width = Math.min(
      Math.max(rect.width, 264),
      viewportWidth - VIEWPORT_GAP * 2,
    );

    return {
      bottom: viewportHeight - rect.top + ANCHOR_GAP,
      left: clamp(
        rect.left,
        VIEWPORT_GAP,
        viewportWidth - width - VIEWPORT_GAP,
      ),
      maxHeight: Math.max(180, rect.top - ANCHOR_GAP - VIEWPORT_GAP),
      width,
      transformOrigin: "bottom left",
    };
  }

  if (placement === "right-start") {
    const width = Math.min(288, viewportWidth - VIEWPORT_GAP * 2);
    const fitsOnRight =
      rect.right + ANCHOR_GAP + width <= viewportWidth - VIEWPORT_GAP;
    const left = fitsOnRight
      ? rect.right + ANCHOR_GAP
      : rect.left - ANCHOR_GAP - width;
    const top = clamp(
      rect.bottom - 64,
      VIEWPORT_GAP,
      viewportHeight - 260,
    );

    return {
      left: clamp(left, VIEWPORT_GAP, viewportWidth - width - VIEWPORT_GAP),
      maxHeight: viewportHeight - top - VIEWPORT_GAP,
      top,
      width,
      transformOrigin: fitsOnRight ? "bottom left" : "bottom right",
    };
  }

  const width = Math.min(352, viewportWidth - VIEWPORT_GAP * 2);
  const top = rect.bottom + ANCHOR_GAP;
  const availableBelow = viewportHeight - top - VIEWPORT_GAP;

  if (availableBelow < 240 && rect.top > availableBelow) {
    return {
      bottom: viewportHeight - rect.top + ANCHOR_GAP,
      left: clamp(
        rect.right - width,
        VIEWPORT_GAP,
        viewportWidth - width - VIEWPORT_GAP,
      ),
      maxHeight: Math.max(180, rect.top - ANCHOR_GAP - VIEWPORT_GAP),
      width,
      transformOrigin: "bottom right",
    };
  }

  return {
    left: clamp(
      rect.right - width,
      VIEWPORT_GAP,
      viewportWidth - width - VIEWPORT_GAP,
    ),
    maxHeight: Math.max(180, availableBelow),
    top,
    width,
    transformOrigin: "top right",
  };
}

export default function PortalPopover({
  anchorRef,
  children,
  className = "",
  open,
  onClose,
  placement = "bottom-end",
}: PortalPopoverProps) {
  const [present, setPresent] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  useEffect(() => {
    let enterFrame = 0;
    let visibleFrame = 0;
    let exitFrame = 0;
    let exitTimeout: number | undefined;

    if (open) {
      enterFrame = window.requestAnimationFrame(() => {
        setPresent(true);
        visibleFrame = window.requestAnimationFrame(() => setVisible(true));
      });
    } else {
      exitFrame = window.requestAnimationFrame(() => setVisible(false));
      exitTimeout = window.setTimeout(() => {
        setPresent(false);
        setPosition(null);
      }, EXIT_DURATION);
    }

    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.cancelAnimationFrame(visibleFrame);
      window.cancelAnimationFrame(exitFrame);
      if (exitTimeout) window.clearTimeout(exitTimeout);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!present) return;

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      setPosition(getPosition(anchor, placement));
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, placement, present]);

  if (typeof document === "undefined" || !present) return null;

  const style = position
    ? ({
        bottom: position.bottom,
        left: position.left,
        maxHeight: position.maxHeight,
        top: position.top,
        width: position.width,
        "--motion-origin": position.transformOrigin,
      } as CSSProperties)
    : undefined;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Tutup menu"
        onClick={onClose}
        className="fixed inset-0 z-[1000] cursor-default bg-slate-950/10"
      />
      <div
        data-state={visible ? "open" : "closed"}
        className={`ui-popover fixed z-[1001] overflow-y-auto overscroll-contain ${className}`}
        style={style}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
