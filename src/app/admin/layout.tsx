import Footer from "@/components/footer";
import Sidebar from "@/components/sidebar";
import type { Metadata } from "next";
import { requireAdminArea } from "@/libs/auth/authorization";

export const metadata: Metadata = {
  title: "MarkasTI | Admin Dashboard",
  description: "Halaman Admin",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminArea();

  return (
    <div className="admin-layout-shell min-h-screen text-[var(--app-text)]">
      <div className="flex min-h-screen w-full">
        <div className="sticky top-0 z-40 h-screen shrink-0 overflow-visible">
          <Sidebar />
        </div>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="admin-page-content flex-1">{children}</div>

          <Footer />
        </section>
      </div>
    </div>
  );
}
