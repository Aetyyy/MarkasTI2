import "server-only";

import { prisma } from "@/libs/prisma";
import type { JadwalDay } from "@prisma/client";
import type { ScheduleForClient } from "@/types/scheduleManagement";
import { getJadwalDayLabel, jadwalDayRank } from "@/types/scheduleManagement";
import { requirePermission } from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

type JadwalFromDb = {
  id: number;
  day: JadwalDay;
  title: string;
  dosenId: number | null;
  dosen: { name: string } | null;
  mataKuliahId: number | null;
  mataKuliah: { code: string; name: string; sks: number } | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function timeToMinutes(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}

function mapSchedule(schedule: JadwalFromDb): ScheduleForClient {
  return {
    id: schedule.id,
    day: schedule.day,
    dayLabel: getJadwalDayLabel(schedule.day),
    title: schedule.title,
    dosenName: schedule.dosen?.name ?? null,
    dosenId: schedule.dosenId,
    mataKuliahId: schedule.mataKuliahId,
    courseCode: schedule.mataKuliah?.code || null,
    sks: schedule.mataKuliah?.sks || null,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    location: schedule.location,
    description: schedule.description,
    isActive: schedule.isActive,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
  };
}

function sortSchedules(a: ScheduleForClient, b: ScheduleForClient) {
  const dayDiff = jadwalDayRank[a.day] - jadwalDayRank[b.day];

  if (dayDiff !== 0) return dayDiff;

  return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
}

export async function getPublicSchedules(): Promise<ScheduleForClient[]> {
  const schedules = await prisma.jadwal.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      day: true,
      title: true,
      dosenId: true,
      dosen: { select: { name: true } },
      mataKuliahId: true,
      mataKuliah: { select: { code: true, name: true, sks: true } },
      startTime: true,
      endTime: true,
      location: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return schedules.map(mapSchedule).sort(sortSchedules);
}

export async function getAdminSchedules(): Promise<ScheduleForClient[]> {
  await requirePermission(PERMISSION_SCOPES.schedules, "read");

  const schedules = await prisma.jadwal.findMany({
    select: {
      id: true,
      day: true,
      title: true,
      dosenId: true,
      dosen: { select: { name: true } },
      mataKuliahId: true,
      mataKuliah: { select: { code: true, name: true, sks: true } },
      startTime: true,
      endTime: true,
      location: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return schedules.map(mapSchedule).sort(sortSchedules);
}
