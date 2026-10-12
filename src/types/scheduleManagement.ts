import type { JadwalDay } from "@prisma/client";

export type JadwalDayValue = JadwalDay;

export type ScheduleForClient = {
  id: number;
  day: JadwalDayValue;
  dayLabel: string;
  title: string;
  dosenName: string | null;
  dosenId: number | null;
  mataKuliahId: number | null;
  courseCode: string | null;
  sks: number | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleActionResult = {
  success: boolean;
  message: string;
};

export type ScheduleDosenOption = {
  id: number;
  name: string;
  mataKuliahIds: number[];
};

export type ScheduleCourseOption = {
  id: number;
  code: string;
  name: string;
  sks: number;
};

export const jadwalDayOptions: {
  value: JadwalDayValue;
  label: string;
}[] = [
  {
    value: "SENIN",
    label: "Senin",
  },
  {
    value: "SELASA",
    label: "Selasa",
  },
  {
    value: "RABU",
    label: "Rabu",
  },
  {
    value: "KAMIS",
    label: "Kamis",
  },
  {
    value: "JUMAT",
    label: "Jumat",
  },
  {
    value: "SABTU",
    label: "Sabtu",
  },
];

export const jadwalDayRank: Record<JadwalDayValue, number> = {
  SENIN: 1,
  SELASA: 2,
  RABU: 3,
  KAMIS: 4,
  JUMAT: 5,
  SABTU: 6,
};

export function getJadwalDayLabel(day: JadwalDayValue) {
  return jadwalDayOptions.find((item) => item.value === day)?.label || day;
}
