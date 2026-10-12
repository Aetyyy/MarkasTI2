"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  FiChevronDown,
  FiGrid,
  FiLogIn,
  FiLogOut,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import NavbarProfileAvatar from "../navbar/navbarProfileAvatar";
import NavbarOnlineIndicator from "../navbar/navbarOnlineIndicator";
import PortalPopover from "@/components/animations/portalPopover";
import {
  getAdminLandingPath,
  hasAssignedRole,
  type AccessPermission,
} from "@/libs/auth/access";

type FastAccountMenuProps = {
  variant?: "navbar" | "mobile" | "sidebar" | "sidebarCollapsed";
  onNavigate?: () => void;
};

type SessionUserWithRoles = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: string[];
  permissions?: AccessPermission[];
};

function getInitials(name?: string | null) {
  if (!name) return "MI";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

function getPrimaryRole(roles?: string[]) {
  if (!roles || roles.length === 0) return "Member";

  return roles[0];
}

export default function FastAccountMenu({
  variant = "navbar",
  onNavigate,
}: FastAccountMenuProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const user = session?.user as SessionUserWithRoles | undefined;

  const name = user?.name || "User";
  const email = user?.email || "";
  const image = user?.image || "";
  const role = getPrimaryRole(user?.roles);
  const hasAdminAccess = hasAssignedRole(user);
  const adminLandingPath = getAdminLandingPath(user);

  const initials = useMemo(() => getInitials(name), [name]);

  const isLoggedIn = status === "authenticated";
  const compact = variant === "sidebarCollapsed";
  const mobile = variant === "mobile";

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    if (open) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    onNavigate?.();
  }

  if (status === "loading") {
    return (
      <div
        className={`animate-pulse rounded-2xl bg-blue-100 ${
          compact ? "h-11 w-11" : "h-12 w-full"
        }`}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        prefetch={false}
        onClick={onNavigate}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm active:scale-95 ${
          compact ? "h-11 w-11 p-0" : "w-full"
        }`}
      >
        {compact ? <FiLogIn className="h-5 w-5" /> : "Login"}
      </Link>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative ${
        variant === "sidebar" || variant === "sidebarCollapsed" ? "z-[200]" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`fast-account-trigger ui-pressable flex items-center rounded-2xl border text-left ${
          compact
            ? "h-11 w-11 justify-center p-0"
            : mobile
              ? "w-full gap-3 px-3 py-3"
              : variant === "sidebar"
                ? "w-full min-w-0 gap-3 px-3 py-2"
                : "max-w-[230px] gap-3 px-3 py-2"
        }`}
      >
        <span
          className={`grid shrink-0 place-items-center overflow-hidden rounded-full text-xs font-black text-white ${image ? "bg-transparent" : "bg-gradient-to-br from-blue-600 to-cyan-400"} ${
            compact ? "h-9 w-9" : "h-10 w-10"
          }`}
        >
          {image ? (
            <NavbarProfileAvatar
              image={session?.user?.image}
              name={session?.user?.name}
              email={session?.user?.email}
              size="md"
              className="h-full! w-full!"
            />
          ) : (
            initials
          )}
        </span>

        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black leading-4 text-slate-950">
                {name}
              </span>
              <span className="mt-1 block truncate text-xs font-bold text-blue-600">
                {role}
              </span>
            </span>

            <FiChevronDown className="ui-chevron h-4 w-4 shrink-0 text-slate-400" />
          </>
        )}
      </button>

      <PortalPopover
        anchorRef={wrapperRef}
        open={open}
        onClose={() => setOpen(false)}
        placement={
          mobile
            ? "mobile-sheet"
            : compact
              ? "right-start"
              : variant === "sidebar"
                ? "top-start"
                : "bottom-end"
        }
        className="rounded-[1.4rem]"
      >
        <div className="fast-account-menu overflow-hidden rounded-[1.4rem] border text-slate-900">
          <div className="border-b border-slate-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black text-white ${image ? "bg-transparent" : "bg-gradient-to-br from-blue-600 to-cyan-400"}`}
              >
                {image ? (
                  <NavbarProfileAvatar
                    image={session?.user?.image}
                    name={session?.user?.name}
                    email={session?.user?.email}
                    size="md"
                    className="h-full! w-full!"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                  {name}
                </p>
                <p className="truncate text-xs font-semibold text-slate-500">
                  {email || role}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-black text-blue-700">
                    {role}
                  </span>
                  <NavbarOnlineIndicator />
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            <Link
              href="/profile"
              prefetch={false}
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition active:scale-[0.98] hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <FiUser className="h-4 w-4" />
              </span>
              Profile
            </Link>

            {hasAdminAccess && adminLandingPath !== "/unauthorized" && (
              <Link
                href={adminLandingPath}
                prefetch={false}
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition active:scale-[0.98] hover:bg-blue-50 hover:text-blue-700"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                  <FiGrid className="h-4 w-4" />
                </span>
                Dashboard
              </Link>
            )}

            <Link
              href="/settings"
              prefetch={false}
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition active:scale-[0.98] hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <FiSettings className="h-4 w-4" />
              </span>
              Pengaturan
            </Link>
          </div>

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNavigate?.();

                void signOut({
                  callbackUrl: "/login",
                });
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black text-rose-600 transition active:scale-[0.98] hover:bg-rose-50"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <FiLogOut className="h-4 w-4" />
              </span>
              Logout
            </button>
          </div>
        </div>
      </PortalPopover>
    </div>
  );
}
