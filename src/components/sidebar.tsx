"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { JetBrains_Mono, Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import type { IconType } from "react-icons";
import {
  FiArrowLeft,
  FiArrowRight,
  FiActivity,
  FiBookOpen,
  FiBookmark,
  FiBell,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiEyeOff,
  FiGitCommit,
  FiHome,
  FiLayers,
  FiLock,
  FiMenu,
  FiShield,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { AiOutlineSafetyCertificate } from "react-icons/ai";
import { TbLockAccess } from "react-icons/tb";
import FastAccountMenu from "@/components/auth/fastAccountMenu";
import NotificationBellButton from "@/components/notifications/notificationBellButton";
import ThemeToggle from "@/components/theme/themeToggle";
import { getAdminLandingPath } from "@/libs/auth/access";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type PermissionAction = "create" | "read" | "update" | "delete";

type SessionPermission = {
  name: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

type AuthSessionUser = {
  name?: string | null;
  email?: string | null;
  nim?: string;
  roles?: string[];
  permissions?: SessionPermission[];
};

type PermissionScope =
  | "dashboard"
  | "activity_log"
  | "changelogs"
  | "announcements"
  | "dosen"
  | "schedules"
  | "users"
  | "teams"
  | "roles"
  | "permissions"
  | "struktur"
  | "attendance"
  | "kas_masuk"
  | "kas_keluar"
  | "gallery";

type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: IconType;
  badge?: string;
  scope?: PermissionScope;
  action?: PermissionAction;
};

type NavGroup = {
  id: string;
  title: string;
  icon: IconType;
  items: NavItem[];
};

type NavigationApiCategory = {
  id: string;
  title: string;
  icon: string;
  items: Array<{
    href: string;
    label: string;
    description: string;
    icon: string;
    badge: string | null;
  }>;
};

const KEEP_GROUPS_STORAGE_KEY = "markasti-sidebar-kept-groups";

const superAdminRoles = [
  "admin",
  "administrator",
  "super_admin",
  "super admin",
];

const navGroups: NavGroup[] = [
  {
    id: "main",
    title: "Main Menu",
    icon: FiHome,
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        desc: "Ringkasan admin",
        icon: FiHome,
        badge: "Live",
        scope: "dashboard",
        action: "read",
      },
      {
        href: "/admin/activity-log",
        label: "Activity Log",
        desc: "Riwayat sistem",
        icon: FiActivity,
        scope: "activity_log",
        action: "read",
      },
      {
        href: "/admin/changelogs",
        label: "Changelogs",
        desc: "Kelola update website",
        icon: FiGitCommit,
        scope: "changelogs",
        action: "read",
      },
      {
        href: "/admin/announcements",
        label: "Pengumuman",
        desc: "Teks berjalan portal",
        icon: FiBell,
        scope: "announcements",
        action: "read",
      },
      {
        href: "/admin/dosen",
        label: "Data Dosen",
        desc: "Kelola dosen",
        icon: FiBookOpen,
        scope: "dosen",
        action: "read",
      },
      {
        href: "/admin/schedules",
        label: "Jadwal",
        desc: "Jadwal kelas",
        icon: FiCalendar,
        scope: "schedules",
        action: "read",
      },
      {
        href: "/admin/users",
        label: "Users",
        desc: "Kelola users",
        icon: FiUsers,
        scope: "users",
        action: "read",
      },
      {
        href: "/admin/teams",
        label: "Teams",
        desc: "Kelola teams",
        icon: FiUsers,
        scope: "teams",
        action: "read",
      },
      {
        href: "/admin/roles",
        label: "Roles",
        desc: "Kelola roles",
        icon: AiOutlineSafetyCertificate,
        scope: "roles",
        action: "read",
      },
      {
        href: "/admin/permissions",
        label: "Permissions",
        desc: "Kelola permissions",
        icon: TbLockAccess,
        scope: "permissions",
        action: "read",
      },
    ],
  },
  {
    id: "akademik",
    title: "Akademik",
    icon: FiLayers,
    items: [
      {
        href: "/admin/struktur",
        label: "Struktur Kelas",
        desc: "Pengurus kelas",
        icon: FiLayers,
        scope: "struktur",
        action: "read",
      },
      {
        href: "/admin/attendance",
        label: "Kehadiran",
        desc: "Absensi kelas",
        icon: FiUsers,
        scope: "attendance",
        action: "read",
      },
    ],
  },
  {
    id: "keuangan",
    title: "Keuangan",
    icon: FiCreditCard,
    items: [
      {
        href: "/admin/kas-masuk",
        label: "Kas Masuk",
        desc: "Pemasukan kas",
        icon: FiDollarSign,
        scope: "kas_masuk",
        action: "read",
      },
      {
        href: "/admin/kas-keluar",
        label: "Kas Keluar",
        desc: "Pengeluaran kas",
        icon: FiCreditCard,
        scope: "kas_keluar",
        action: "read",
      },
    ],
  },
];

const iconMap: Record<string, IconType> = {
  home: FiHome,
  activity: FiActivity,
  book: FiBookOpen,
  bell: FiBell,
  calendar: FiCalendar,
  users: FiUsers,
  team: FiUsers,
  layers: FiLayers,
  attendance: FiUsers,
  shield: FiShield,
  lock: FiLock,
  menu: FiMenu,
  dollar: FiDollarSign,
  "credit-card": FiCreditCard,
  database: FiDatabase,
};

function mapDatabaseNavigation(categories: NavigationApiCategory[]): NavGroup[] {
  return categories.map((category) => ({
    id: category.id,
    title: category.title,
    icon: iconMap[category.icon] || FiLayers,
    items: category.items.map((item) => ({
      href: item.href,
      label: item.label,
      desc: item.description,
      icon: iconMap[item.icon] || FiLayers,
      badge: item.badge || undefined,
    })),
  }));
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function isSuperAdmin(user?: AuthSessionUser) {
  const roles = user?.roles;

  if (!roles || roles.length === 0) return false;

  return roles.some((role) => superAdminRoles.includes(normalize(role)));
}

function canAccessItem(user: AuthSessionUser | undefined, item: NavItem) {
  if (!item.scope) return true;
  if (!user) return false;
  if (isSuperAdmin(user)) return true;

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const targetScope = normalize(item.scope);
  const action = item.action ?? "read";

  const permission = permissions.find(
    (itemPermission) => normalize(itemPermission.name) === targetScope,
  );

  if (!permission) return false;

  return Boolean(permission[action]);
}

function getPrimaryRole(roles?: string[]) {
  if (!roles || roles.length === 0) return "User";

  return roles[0];
}

function filterNavGroups(user: AuthSessionUser | undefined) {
  if (!user) return [];

  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessItem(user, item)),
    }))
    .filter((group) => group.items.length > 0);
}

function getActiveHref(pathname: string, groups: NavGroup[]) {
  return (
    groups
      .flatMap((group) => group.items)
      .filter(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      )
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? ""
  );
}

function getActiveGroupId(activeHref: string, groups: NavGroup[]) {
  if (!activeHref) return "";

  return (
    groups.find((group) =>
      group.items.some((item) => item.href === activeHref),
    )?.id ?? ""
  );
}

function getStoredKeptGroups() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(KEEP_GROUPS_STORAGE_KEY);
    if (!raw) return new Set<string>();

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return new Set<string>();

    return new Set(parsed.map((item) => String(item)));
  } catch {
    return new Set<string>();
  }
}

function saveStoredKeptGroups(groups: Set<string>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      KEEP_GROUPS_STORAGE_KEY,
      JSON.stringify(Array.from(groups)),
    );
  } catch {
    // ignore
  }
}

function SidebarMenuItem({
  item,
  active,
  compact,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  compact: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={compact ? item.label : undefined}
      data-active={active}
      className={cn(
        "admin-sidebar-item ui-pressable group relative flex items-center border",
        compact
          ? "h-12 w-12 justify-center rounded-2xl p-0"
          : "gap-3 rounded-2xl px-3 py-2.5",
      )}
    >
      <div
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-center rounded-xl transition duration-150",
          compact ? "h-12 w-12" : "h-10 w-10",
          active
            ? "bg-blue-600 text-white"
            : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {!compact && (
        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-black">{item.label}</p>

            {item.badge && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
                {item.badge}
              </span>
            )}
          </div>

          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
            {item.desc}
          </p>
        </div>
      )}

      {active && !compact && (
        <span className="absolute right-2 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-blue-600" />
      )}

      {active && compact && (
        <span className="absolute -right-1 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-blue-600" />
      )}
    </Link>
  );
}

const MemoSidebarMenuItem = memo(SidebarMenuItem);

function AdminSidebarContent({
  collapsed,
  mobileMode = false,
  onToggleCollapse,
  onCloseMobile,
}: {
  collapsed: boolean;
  mobileMode?: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const user = session?.user as AuthSessionUser | undefined;
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const primaryRole = getPrimaryRole(roles);
  const superAdmin = isSuperAdmin(user);
  const adminLandingPath = getAdminLandingPath(user);

  const compact = collapsed && !mobileMode;

  const [databaseGroups, setDatabaseGroups] = useState<NavGroup[] | null>(null);

  const loadNavigation = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const response = await fetch("/api/admin/navigation", {
        cache: "no-store",
      });
      const result = await response.json();

      if (result.ok && Array.isArray(result.data)) {
        setDatabaseGroups(mapDatabaseNavigation(result.data));
      }
    } catch {
      // Sidebar lama tetap ditampilkan jika koneksi sementara terputus.
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNavigation(), 0);

    const reload = () => void loadNavigation();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "markasti-navigation-version") reload();
    };
    const channel =
      "BroadcastChannel" in window
        ? new BroadcastChannel("markasti-navigation")
        : null;

    window.addEventListener("markasti-navigation-updated", reload);
    window.addEventListener("storage", handleStorage);
    channel?.addEventListener("message", reload);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("markasti-navigation-updated", reload);
      window.removeEventListener("storage", handleStorage);
      channel?.removeEventListener("message", reload);
      channel?.close();
    };
  }, [loadNavigation]);

  const visibleGroups = useMemo(
    () => databaseGroups ?? filterNavGroups(user),
    [databaseGroups, user],
  );

  const activeHref = useMemo(
    () => getActiveHref(pathname, visibleGroups),
    [pathname, visibleGroups],
  );
  const activeGroupId = useMemo(
    () => getActiveGroupId(activeHref, visibleGroups),
    [activeHref, visibleGroups],
  );

  const [keptGroups, setKeptGroups] = useState<Set<string>>(() => new Set());
  const [tempOpenedGroups, setTempOpenedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [manualClosedGroups, setManualClosedGroups] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setKeptGroups(getStoredKeptGroups());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTempOpenedGroups(new Set());
      setManualClosedGroups(new Set());
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeGroupId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setKeptGroups((prev) => {
        const validGroupIds = new Set(visibleGroups.map((group) => group.id));
        const next = new Set<string>();

        prev.forEach((groupId) => {
          if (validGroupIds.has(groupId)) {
            next.add(groupId);
          }
        });

        saveStoredKeptGroups(next);
        return next;
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [visibleGroups]);

  const totalMenus = useMemo(() => {
    return visibleGroups.reduce(
      (total, group) => total + group.items.length,
      0,
    );
  }, [visibleGroups]);

  function isActive(href: string) {
    return href === activeHref;
  }

  function isGroupOpen(groupId: string) {
    if (manualClosedGroups.has(groupId)) return false;
    if (keptGroups.has(groupId)) return true;
    if (tempOpenedGroups.has(groupId)) return true;

    return groupId === activeGroupId;
  }

  function toggleGroup(groupId: string) {
    const open = isGroupOpen(groupId);

    if (open) {
      setTempOpenedGroups((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });

      setKeptGroups((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        saveStoredKeptGroups(next);
        return next;
      });

      setManualClosedGroups((prev) => {
        const next = new Set(prev);
        next.add(groupId);
        return next;
      });

      return;
    }

    setManualClosedGroups((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });

    setTempOpenedGroups((prev) => {
      const next = new Set(prev);
      next.add(groupId);
      return next;
    });
  }

  function toggleKeepGroup(groupId: string) {
    setKeptGroups((prev) => {
      const next = new Set(prev);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      saveStoredKeptGroups(next);
      return next;
    });

    setManualClosedGroups((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  }

  const sidebarWidth = compact
    ? "w-[5.25rem]"
    : mobileMode
      ? "w-[min(18rem,86vw)]"
      : "w-[18rem]";

  return (
    <aside
      className={cn(
        jakarta.className,
        "admin-sidebar relative flex h-dvh max-h-dvh shrink-0 flex-col overflow-visible border-r transition-[width] duration-200",
        sidebarWidth,
      )}
    >
      <div
        className={cn(
          "admin-sidebar-header relative z-10 flex shrink-0 items-center border-b p-3",
          compact ? "justify-center" : "justify-between gap-3",
        )}
      >
        {compact ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <FiShield className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
            <span className="absolute -right-2 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white transition group-hover:bg-white group-hover:text-blue-700">
              <FiArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ) : (
          <>
            <Link
              href={adminLandingPath}
              onClick={onCloseMobile}
              className="flex min-w-0 items-center gap-3"
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
                <FiShield className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
              </div>

              <div className="min-w-0">
                <h1
                  className={`${orbitron.className} truncate text-lg font-black tracking-wide text-slate-950`}
                >
                  MarkasTI
                </h1>

                <p
                  className={`${jetbrains.className} text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600`}
                >
                  Admin Panel
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={onCloseMobile}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white lg:hidden"
              aria-label="Tutup sidebar"
            >
              <FiX className="h-5 w-5" />
            </button>

            {!mobileMode && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white lg:flex"
                aria-label="Collapse sidebar"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>

      {!compact && !mobileMode && (
        <div className="relative z-10 shrink-0 px-3 pt-3">
          <div className="admin-sidebar-status overflow-hidden rounded-3xl border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <FiDatabase className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-black text-slate-950">Admin Mode</p>
                <p className="text-xs font-semibold text-blue-600">
                  {totalMenus} menu aktif
                </p>
              </div>
            </div>

            <div
              className={`${jetbrains.className} mt-3 rounded-2xl bg-blue-50 p-3 text-[10px] leading-5 text-slate-600`}
            >
              <p>
                status:{" "}
                <span
                  className={cn(
                    "font-black",
                    status === "authenticated"
                      ? "text-emerald-600"
                      : "text-rose-600",
                  )}
                >
                  {status === "authenticated" ? "authenticated" : "guest"}
                </span>
              </p>

              <p>
                role:{" "}
                <span className="font-black text-blue-700">{primaryRole}</span>
              </p>

              <p>
                access:{" "}
                <span className="font-black text-blue-700">
                  {superAdmin ? "super-admin" : "permission-based"}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {!compact && mobileMode && (
        <div className="relative z-10 shrink-0 px-3 pt-3">
          <div className="admin-sidebar-status flex items-center justify-between rounded-2xl border px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-slate-950">
                {status === "authenticated" ? primaryRole : "Guest"}
              </p>
              <p className="truncate text-[10px] font-semibold text-blue-600">
                {totalMenus} menu tersedia
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600">
              Online
            </span>
          </div>
        </div>
      )}

      <nav
        className={cn(
          "sidebar-light-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4",
          compact && "flex flex-col items-center",
        )}
      >
        {status === "loading" ? (
          <div
            className={cn("space-y-3", compact && "flex flex-col items-center")}
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "animate-pulse rounded-2xl bg-white shadow-sm",
                  compact ? "h-12 w-12" : "h-16 w-full",
                )}
              />
            ))}
          </div>
        ) : visibleGroups.length === 0 ? (
          <div
            className={cn(
              "rounded-3xl border border-dashed border-blue-200 bg-white p-4 text-center shadow-sm",
              compact && "hidden",
            )}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FiEyeOff className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-black text-slate-900">
              Tidak ada menu
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Role kamu belum memiliki permission untuk menu admin.
            </p>
          </div>
        ) : (
          <div className={cn("space-y-3", compact && "w-full")}>
            {visibleGroups.map((group) => {
              const GroupIcon = group.icon;
              const open = isGroupOpen(group.id);
              const kept = keptGroups.has(group.id);
              const groupActive = group.id === activeGroupId;

              return (
                <div key={group.id} className="w-full">
                  {!compact ? (
                    <div className="mb-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        aria-expanded={open}
                        data-active={groupActive}
                        className="admin-sidebar-group-trigger ui-pressable flex min-w-0 flex-1 items-center justify-between rounded-2xl px-3 py-2 text-left"
                      >
                        <span
                          className={`${jetbrains.className} flex min-w-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500`}
                        >
                          <GroupIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{group.title}</span>

                          {kept && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] text-blue-700">
                              KEEP
                            </span>
                          )}
                        </span>

                        <FiChevronDown
                          className="ui-chevron h-4 w-4 shrink-0 text-blue-500"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleKeepGroup(group.id)}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs transition duration-150",
                          kept
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-blue-600 hover:bg-blue-50",
                        )}
                        title={
                          kept
                            ? "Matikan keep kategori"
                            : "Keep kategori tetap terbuka"
                        }
                      >
                        {kept ? (
                          <FiLock className="h-3.5 w-3.5" />
                        ) : (
                          <FiBookmark className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      title={group.title}
                      className={cn(
                        "mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-blue-600 transition duration-150",
                        open
                          ? "bg-white shadow-sm ring-1 ring-blue-100"
                          : "bg-blue-50",
                      )}
                    >
                      <GroupIcon className="h-4 w-4" />
                    </button>
                  )}

                  <div className="ui-collapse" data-state={open ? "open" : "closed"} inert={!open}>
                    <div>
                      <div
                        className={cn(
                          "space-y-2 pb-1",
                          compact && "flex flex-col items-center",
                        )}
                      >
                      {group.items.map((item) => (
                        <MemoSidebarMenuItem
                          key={`${group.id}:${item.href}`}
                          item={item}
                          active={isActive(item.href)}
                          compact={compact}
                          onNavigate={onCloseMobile}
                        />
                      ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      <div
        className={cn(
          "admin-sidebar-footer relative z-[60] shrink-0 border-t p-3",
          compact && "flex justify-center",
          mobileMode && "sticky bottom-0",
        )}
      >
        <div
          className={cn(
            "flex w-full items-center gap-2",
            compact && "justify-center",
          )}
        >
          <div className={cn("min-w-0 flex-1", compact && "flex-none")}>
            <FastAccountMenu
              variant={compact ? "sidebarCollapsed" : "sidebar"}
              onNavigate={onCloseMobile}
            />
          </div>
          {!compact && (
            <div className="admin-sidebar-footer-actions flex shrink-0 items-center gap-2">
              <ThemeToggle />
              {!mobileMode && <NotificationBellButton variant="mobile" />}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .sidebar-light-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .sidebar-light-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </aside>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMobileOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <>
      <div className="fixed right-4 top-4 z-[70] flex items-center gap-2 lg:hidden">
        <ThemeToggle />
        <NotificationBellButton variant="mobile" />
      </div>
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-[70] flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-lg shadow-blue-900/10 transition active:scale-95 hover:bg-blue-600 hover:text-white lg:hidden"
          aria-label="Buka sidebar"
        >
          <FiMenu className="h-6 w-6" />
        </button>
      )}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[70] bg-slate-950/30 lg:hidden"
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 z-[80] h-dvh transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <AdminSidebarContent
          collapsed={false}
          mobileMode
          onToggleCollapse={() => {}}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </div>

      <div className="hidden lg:sticky lg:top-0 lg:z-30 lg:block">
        <AdminSidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />
      </div>
    </>
  );
}
