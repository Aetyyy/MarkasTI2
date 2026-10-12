import ScheduleViewer from "@/components/schedules/scheduleViewer";
import { getPublicSchedules } from "@/libs/schedules/query";

export const dynamic = "force-dynamic";

function getTodayLabel() {
  const day = new Date().getDay();

  if (day === 1) return "Senin";
  if (day === 2) return "Selasa";
  if (day === 3) return "Rabu";
  if (day === 4) return "Kamis";
  if (day === 5) return "Jumat";
  if (day === 6) return "Sabtu";

  return "Minggu";
}

export default async function JadwalPage() {
  const schedules = await getPublicSchedules();

  return (
    <main className="app-page-canvas min-h-screen overflow-hidden pt-16 md:pt-28">
      <section className="relative container mx-auto px-4 py-8 md:py-12">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-80 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl space-y-8">
          <div className="schedule-enter overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-xl shadow-blue-900/10 backdrop-blur-xl">
            <div className="relative p-6 md:p-8">
              <div className="absolute right-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_40%)]" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                    Jadwal Perkuliahan Teknik Informatika
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                    Jadwal Kuliah
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                    Data jadwal bisa berubah sewaktu-waktu. Pastikan untuk
                    selalu memeriksa jadwal terbaru sebelum menghadiri kelas.
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-blue-600 p-5 text-white shadow-lg shadow-blue-700/20">
                  <p className="text-xs font-medium text-blue-100">Hari ini</p>

                  <p className="mt-1 text-2xl font-black">{getTodayLabel()}</p>

                  <p className="mt-2 text-sm text-blue-100">
                    {new Date().toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ScheduleViewer schedules={schedules} />
        </div>
      </section>

      <style>{`
        @keyframes scheduleEnter {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .schedule-enter {
          opacity: 0;
          animation: scheduleEnter 500ms ease-out both;
        }
      `}</style>
    </main>
  );
}
