"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminUser } from "@/libs/useAdminUser";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAdminUser();

  // Redirect to login if not authenticated
  if (!loading && !user) {
    router.push("/admin/login");
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/dosen", label: "Data Dosen" },
    { href: "/admin/attendance", label: "Kehadiran" },
    { href: "/admin/kas-masuk", label: "Kas Masuk" },
    { href: "/admin/kas-keluar", label: "Kas Keluar" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white p-6 overflow-y-auto flex flex-col">
        <div>
          <h1 className="text-2xl font-bold mb-8">Markas TI Admin</h1>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 rounded ${
                  pathname === item.href ? "bg-blue-700" : "hover:bg-blue-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="mt-auto pt-4 border-t border-blue-800">
          <div className="mb-4">
            <p className="text-sm text-blue-200">Logged in as:</p>
            <p className="font-semibold truncate">{user?.email}</p>
            <p className="text-xs text-blue-300">Role: {user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
