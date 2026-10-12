export default function LoadingAdminAnggota() {
  return (
    <main className="app-page-canvas min-h-screen p-4 md:p-6">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-4xl border border-white/70 bg-white/70 p-7 shadow-2xl shadow-blue-900/10 backdrop-blur-xl">
          <div className="h-8 w-52 animate-pulse rounded-full bg-blue-100" />
          <div className="mt-5 h-10 w-80 max-w-full animate-pulse rounded-full bg-blue-100" />
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-full bg-blue-50" />
          <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded-full bg-blue-50" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lg shadow-blue-900/5"
            >
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-blue-100" />
              <div className="mt-4 h-4 w-28 animate-pulse rounded-full bg-blue-100" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded-full bg-blue-100" />
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-4xl border border-white/70 bg-white/70 p-4 shadow-lg shadow-blue-900/5">
          <div className="h-14 w-full animate-pulse rounded-3xl bg-blue-100" />
        </div>

        <div className="mt-6 rounded-4xl border border-white/70 bg-white/70 p-4 shadow-xl shadow-blue-900/5">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-3xl bg-blue-50"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
