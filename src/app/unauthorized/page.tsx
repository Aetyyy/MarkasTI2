import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="app-page-canvas grid min-h-screen place-items-center px-[var(--app-page-gutter)]">
      <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-rose-50 text-3xl">
          🚫
        </div>

        <h1 className="mt-5 text-3xl font-black text-slate-900">
          Akses Ditolak
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Role akun kamu belum memiliki permission untuk halaman atau fitur ini.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
