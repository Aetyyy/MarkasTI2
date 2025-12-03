import { prisma } from "./prisma";
import type { Attendance } from "./types";

export async function getAttendance(filters?: { dosenId?: number; date?: string }): Promise<Attendance[]> {
  const records = await prisma.attendance.findMany({
    where: {
      ...(filters?.dosenId && { dosenId: filters.dosenId }),
      ...(filters?.date && { date: new Date(filters.date) }),
    },
    orderBy: [{ date: "desc" }, { time: "desc" }],
    include: { dosen: true },
  });
  return records.map(r => ({
    id: r.id,
    dosenId: r.dosenId,
    date: r.date.toISOString().split('T')[0],
    time: r.time.toISOString().split('T')[1].split('.')[0],
    status: r.status as "hadir" | "tidak_hadir",
    keterangan: r.keterangan || undefined,
    createdAt: r.createdAt,
  }));
}

export async function recordAttendance(data: Omit<Attendance, "id" | "createdAt">): Promise<Attendance> {
  const record = await prisma.attendance.create({
    data: {
      dosenId: data.dosenId,
      date: new Date(data.date),
      time: new Date(`2000-01-01T${data.time}`),
      status: data.status,
      keterangan: data.keterangan,
    },
    include: { dosen: true },
  });
  return {
    id: record.id,
    dosenId: record.dosenId,
    date: record.date.toISOString().split('T')[0],
    time: record.time.toISOString().split('T')[1].split('.')[0],
    status: record.status as "hadir" | "tidak_hadir",
    keterangan: record.keterangan || undefined,
    createdAt: record.createdAt,
  };
}
