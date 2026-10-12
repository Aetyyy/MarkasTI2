import { FiCpu, FiDatabase, FiTerminal } from "react-icons/fi";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9998] grid place-items-center bg-[var(--app-bg)] px-4 text-[var(--app-text)]">
      <div className="w-full max-w-xl rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-7 text-center shadow-[var(--app-shadow)]">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[1.7rem] bg-blue-600 text-white shadow-xl shadow-blue-600/25">
          <FiCpu className="h-12 w-12" />
        </div>

        <h2 className="mt-7 text-3xl font-black tracking-tight text-[var(--app-text)]">
          MarkasTI
        </h2>

        <p className="mt-2 text-xs font-black uppercase tracking-[0.45em] text-blue-600">
          Loading Route
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] p-4 text-left">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
                <FiTerminal className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[var(--app-text)]">
                  Preparing interface
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 text-left">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500 text-white">
                <FiDatabase className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black text-[var(--app-text)]">
                  Syncing page data
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--app-muted)]">
                  Mohon tunggu sebentar...
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-2 text-sm font-black text-[var(--app-accent-strong)] shadow-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
          Preparing page
        </div>
      </div>
    </div>
  );
}
