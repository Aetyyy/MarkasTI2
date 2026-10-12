import Link from "next/link";
import { FiArrowUpRight, FiBell } from "react-icons/fi";
import { prisma } from "@/libs/prisma";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const items = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-5xl px-[var(--app-page-gutter)] pb-20 pt-32">
      <header className="mb-8 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-7 shadow-[var(--app-shadow)] sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-accent-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--app-accent)]"><FiBell /> Papan informasi</span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-[var(--app-text)]">Pengumuman</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--app-muted)]">Informasi terbaru untuk seluruh warga MarkasTI, dirangkum di satu tempat.</p>
      </header>
      <section className="space-y-4" aria-label="Daftar pengumuman">
        {items.length ? items.map((item) => (
          <article key={item.id} className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--app-accent)]">{item.publishedAt?.toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }) || "Terbaru"}</p>
            <h2 className="mt-3 text-2xl font-black text-[var(--app-text)]">{item.title}</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--app-muted)]">{item.body}</p>
            {item.url && <Link href={item.url} className="mt-5 inline-flex items-center gap-2 font-bold text-[var(--app-accent)]">Buka informasi <FiArrowUpRight /></Link>}
          </article>
        )) : <p className="rounded-3xl border border-dashed border-[var(--app-border)] p-10 text-center text-[var(--app-muted)]">Belum ada pengumuman yang diterbitkan.</p>}
      </section>
    </main>
  );
}
