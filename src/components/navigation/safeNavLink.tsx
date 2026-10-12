"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

type SafeNavLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onNavigate?: () => void;
};

let globalNavigating = false;
let globalUnlockTimer: number | null = null;

export default function SafeNavLink({
  href,
  children,
  className,
  title,
  onNavigate,
}: SafeNavLinkProps) {
  const router = useRouter();
  const pathname = usePathname();

  const targetRef = useRef<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (!targetRef.current) return;

    if (pathname === targetRef.current) {
      globalNavigating = false;
      targetRef.current = null;
      // Reset ini sengaja mengikuti perubahan pathname dari router.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisabled(false);

      if (globalUnlockTimer) {
        window.clearTimeout(globalUnlockTimer);
        globalUnlockTimer = null;
      }
    }
  }, [pathname]);

  function unlockLater() {
    if (globalUnlockTimer) {
      window.clearTimeout(globalUnlockTimer);
    }

    globalUnlockTimer = window.setTimeout(() => {
      globalNavigating = false;
      targetRef.current = null;
      setDisabled(false);
    }, 1800);
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;

    event.preventDefault();

    if (pathname === href) {
      onNavigate?.();
      return;
    }

    if (globalNavigating) return;

    globalNavigating = true;
    targetRef.current = href;
    setDisabled(true);
    onNavigate?.();

    router.push(href);
    unlockLater();
  }

  return (
    <Link
      href={href}
      title={title}
      prefetch={false}
      onClick={handleClick}
      aria-disabled={disabled}
      className={`${className || ""} ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      {children}
    </Link>
  );
}
