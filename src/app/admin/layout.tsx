"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminUser } from "@/libs/useAdminUser";
import AdminLoginForm from "@/components/AdminLoginForm";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAdminUser();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/dosen", label: "Data Dosen" },
    { href: "/admin/jadwal", label: "Jadwal" },
    { href: "/admin/struktur", label: "Struktur Kelas" },
    { href: "/admin/attendance", label: "Kehadiran" },
    { href: "/admin/kas-masuk", label: "Kas Masuk" },
    { href: "/admin/kas-keluar", label: "Kas Keluar" },
  ];

  // Render inline login if unauthenticated
  if (!loading && !user) {
    // Render inline login so admin area and login are combined
    return (
      <div className="flex h-screen bg-gray-100">
        <aside className="w-64 bg-blue-900 text-white p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-8">Markas TI Admin</h1>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <span key={item.href} className="block px-4 py-2 rounded text-blue-200">
                {item.label}
              </span>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <div className="max-w-3xl w-full">
            <AdminLoginForm onSuccess={() => router.push("/admin/dashboard")} />
          </div>
        </main>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

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
