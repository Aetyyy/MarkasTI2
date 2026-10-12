"use server";

import { JadwalDay, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/libs/prisma";
import type { ScheduleActionResult } from "@/types/scheduleManagement";
import {
  getAuthorizationErrorMessage,
  requirePermission,
} from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

const PUBLIC_SCHEDULES_PATH = "/schedules";
const ADMIN_SCHEDULES_PATH = "/admin/schedules";

const dayValues: JadwalDay[] = [
  "SENIN",
  "SELASA",
  "RABU",
  "KAMIS",
  "JUMAT",
  "SABTU",
];

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function isValidDay(value: string): value is JadwalDay {
  return dayValues.includes(value as JadwalDay);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}

function getErrorMessage(error: unknown) {
  const accessMessage = getAuthorizationErrorMessage(error);

  if (accessMessage) {
    return accessMessage;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return "Jadwal tidak ditemukan.";
    }

    if (error.code === "P2002") {
      return "Jadwal sudah terdaftar.";
    }
  }

  return "Terjadi kesalahan pada server.";
}

export async function saveScheduleAction(
  formData: FormData,
  scheduleId?: number,
): Promise<ScheduleActionResult> {
  try {
    await requirePermission(
      PERMISSION_SCOPES.schedules,
      scheduleId ? "update" : "create",
    );

    const day = getFormString(formData, "day");
    const title = getFormString(formData, "title");
    const dosenIdValue = getFormString(formData, "dosenId");
    const dosenId = dosenIdValue ? Number(dosenIdValue) : null;
    const mataKuliahIdValue = getFormString(formData, "mataKuliahId");
    const mataKuliahId = mataKuliahIdValue ? Number(mataKuliahIdValue) : null;
    const startTime = getFormString(formData, "startTime");
    const endTime = getFormString(formData, "endTime");
    const location = getFormString(formData, "location");
    const description = getFormString(formData, "description");
    const isActive = formData.get("isActive") === "on";

    if (!isValidDay(day)) {
      return {
        success: false,
        message: "Hari jadwal tidak valid.",
      };
    }

    if (!title) {
      return {
        success: false,
        message: "Nama mata kuliah / kegiatan wajib diisi.",
      };
    }

    if (dosenIdValue && (!Number.isSafeInteger(dosenId) || dosenId! <= 0)) {
      return { success: false, message: "Dosen yang dipilih tidak valid." };
    }

    if (dosenId) {
      const dosen = await prisma.dosen.findUnique({
        where: { id: dosenId },
        select: { id: true },
      });
      if (!dosen) {
        return { success: false, message: "Dosen tidak ditemukan di master data." };
      }
    }

    if (dosenId && mataKuliahId) {
      const assignment = await prisma.dosenMataKuliah.findUnique({
        where: { dosenId_mataKuliahId: { dosenId, mataKuliahId } },
      });
      if (!assignment) {
        return { success: false, message: "Dosen tersebut belum terhubung dengan mata kuliah yang dipilih." };
      }
    }

    if (!startTime || !isValidTime(startTime)) {
      return {
        success: false,
        message: "Jam mulai wajib diisi dengan format yang benar.",
      };
    }

    if (endTime && !isValidTime(endTime)) {
      return {
        success: false,
        message: "Jam selesai tidak valid.",
      };
    }

    if (endTime && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return {
        success: false,
        message: "Jam selesai harus lebih besar dari jam mulai.",
      };
    }

    const data: Prisma.JadwalUncheckedCreateInput = {
      day,
      title,
      dosenId,
      mataKuliahId,
      startTime,
      endTime: endTime || null,
      location: location || null,
      description: description || null,
      isActive,
    };

    if (scheduleId) {
      const updateData: Prisma.JadwalUncheckedUpdateInput = {
        day,
        title,
        dosenId,
        mataKuliahId,
        startTime,
        endTime: endTime || null,
        location: location || null,
        description: description || null,
        isActive,
      };

      await prisma.jadwal.update({
        where: {
          id: scheduleId,
        },
        data: updateData,
      });

      revalidatePath(PUBLIC_SCHEDULES_PATH);
      revalidatePath(ADMIN_SCHEDULES_PATH);

      return {
        success: true,
        message: "Jadwal berhasil diperbarui.",
      };
    }

    await prisma.jadwal.create({
      data,
    });

    revalidatePath(PUBLIC_SCHEDULES_PATH);
    revalidatePath(ADMIN_SCHEDULES_PATH);

    return {
      success: true,
      message: "Jadwal berhasil dibuat.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}

export async function deleteScheduleAction(
  scheduleId: number,
): Promise<ScheduleActionResult> {
  try {
    await requirePermission(PERMISSION_SCOPES.schedules, "delete");

    if (!scheduleId) {
      return {
        success: false,
        message: "ID jadwal tidak valid.",
      };
    }

    await prisma.jadwal.delete({
      where: {
        id: scheduleId,
      },
    });

    revalidatePath(PUBLIC_SCHEDULES_PATH);
    revalidatePath(ADMIN_SCHEDULES_PATH);

    return {
      success: true,
      message: "Jadwal berhasil dihapus.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}

export async function toggleScheduleStatusAction(
  scheduleId: number,
  isActive: boolean,
): Promise<ScheduleActionResult> {
  try {
    await requirePermission(PERMISSION_SCOPES.schedules, "update");

    if (!scheduleId) {
      return {
        success: false,
        message: "ID jadwal tidak valid.",
      };
    }

    await prisma.jadwal.update({
      where: {
        id: scheduleId,
      },
      data: {
        isActive,
      },
    });

    revalidatePath(PUBLIC_SCHEDULES_PATH);
    revalidatePath(ADMIN_SCHEDULES_PATH);

    return {
      success: true,
      message: isActive
        ? "Jadwal berhasil diaktifkan."
        : "Jadwal dinonaktifkan.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}
