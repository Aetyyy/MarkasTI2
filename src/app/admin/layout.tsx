"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/dosen", label: "Data Dosen" },
    { href: "/admin/attendance", label: "Kehadiran" },
    { href: "/admin/kas-masuk", label: "Kas Masuk" },
    { href: "/admin/kas-keluar", label: "Kas Keluar" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white p-6 overflow-y-auto">
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
