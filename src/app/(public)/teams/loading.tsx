export default function LoadingAnggotaPage() {
  return (
    <main className="app-page-canvas relative min-h-screen overflow-hidden pt-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-80 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

      <section className="relative container mx-auto px-4 py-10 md:py-14">
        <div className="rounded-4xl border border-white/70 bg-white/75 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl md:p-8">
          <div className="h-9 w-56 animate-pulse rounded-full bg-blue-100" />
          <div className="mt-6 h-12 w-full max-w-xl animate-pulse rounded-full bg-blue-100" />
          <div className="mt-5 h-4 w-full max-w-2xl animate-pulse rounded-full bg-blue-50" />
          <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded-full bg-blue-50" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-4xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-blue-900/5"
            >
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-blue-100" />
              <div className="mt-4 h-4 w-28 animate-pulse rounded-full bg-blue-100" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded-full bg-blue-100" />
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-4xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-blue-900/5">
          <div className="h-14 w-full animate-pulse rounded-3xl bg-blue-100" />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[42rem] rounded-4xl border border-white/70 bg-white/70 p-3 shadow-lg shadow-blue-900/5"
            >
              <div className="aspect-4/5 animate-pulse rounded-[1.45rem] bg-blue-100" />
              <div className="mt-5 h-4 w-2/3 animate-pulse rounded-full bg-blue-100" />
              <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-blue-50" />
              <div className="mt-3 h-20 w-full animate-pulse rounded-3xl bg-blue-50" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
