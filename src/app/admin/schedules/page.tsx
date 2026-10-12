import ScheduleManagement from "@/components/admin/scheduleManagement";
import { requirePagePermission } from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";
import { getAdminSchedules } from "@/libs/schedules/query";
import { prisma } from "@/libs/prisma";
import { auth } from "@/auth";
import { getCrudAccess } from "@/libs/auth/access";

export const dynamic = "force-dynamic";

export default async function AdminSchedulesPage() {
  await requirePagePermission(PERMISSION_SCOPES.schedules, "read");

  const [session, schedules, dosen, courses] = await Promise.all([
    auth(),
    getAdminSchedules(),
    prisma.dosen.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        mataKuliah: { select: { mataKuliahId: true } },
      },
    }),
    prisma.mataKuliah.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, sks: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <ScheduleManagement
        initialSchedules={schedules}
        access={getCrudAccess(session?.user, PERMISSION_SCOPES.schedules)}
        dosenOptions={dosen.map((item) => ({
          id: item.id,
          name: item.name,
          mataKuliahIds: item.mataKuliah.map((entry) => entry.mataKuliahId),
        }))}
        courseOptions={courses}
      />
    </main>
  );
}
