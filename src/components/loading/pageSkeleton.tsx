type PageSkeletonProps = {
  variant?: "public" | "admin";
};

function Block({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-white/10 ${className}`}
    />
  );
}

export function PageSkeleton({ variant = "public" }: PageSkeletonProps) {
  const isAdmin = variant === "admin";

  return (
    <main
      aria-label="Memuat halaman"
      aria-busy="true"
      className={`min-h-[60vh] ${isAdmin ? "mx-auto max-w-7xl px-4 py-8" : "app-page-canvas px-[var(--app-page-gutter)] pb-16 pt-28"}`}
    >
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-6 shadow-sm md:p-8">
        <Block className="h-4 w-28 rounded-full" />
        <Block className="mt-5 h-10 w-2/3 max-w-xl rounded-full" />
        <Block className="mt-4 h-4 w-full max-w-2xl rounded-full" />
        <Block className="mt-2 h-4 w-3/4 max-w-xl rounded-full" />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-5"
          >
            <Block className="h-10 w-10 rounded-2xl" />
            <Block className="mt-4 h-3 w-24 rounded-full" />
            <Block className="mt-3 h-7 w-20 rounded-full" />
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Block className="h-7 w-48 rounded-full" />
          <Block className="h-10 w-36 rounded-xl" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: isAdmin ? 6 : 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-2xl p-3">
              <Block className="h-11 w-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Block className="h-4 w-1/3 rounded-full" />
                <Block className="h-3 w-2/3 rounded-full" />
              </div>
              {isAdmin && <Block className="h-8 w-20 rounded-xl" />}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-label="Memuat data" aria-busy="true" className="space-y-3 py-6">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-4">
          <Block className="h-4 w-24 shrink-0 rounded-full" />
          <Block className="h-4 flex-1 rounded-full" />
          <Block className="hidden h-4 w-28 rounded-full sm:block" />
          <Block className="h-8 w-8 shrink-0 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
