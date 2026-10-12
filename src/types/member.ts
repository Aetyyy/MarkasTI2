import type { ClassPosition, UserStatus } from "@prisma/client";

export type ClassMemberRole = ClassPosition;
export type ClassMemberStatus = UserStatus;

export const roleLabels: Record<ClassMemberRole, string> = {
  KETUA_KELAS: "Ketua Kelas",
  WAKIL_KETUA_KELAS: "Wakil Ketua Kelas",
  SEKRETARIS: "Sekretaris",
  BENDAHARA_1: "Bendahara 1",
  BENDAHARA_2: "Bendahara 2",
  ANGGOTA: "Anggota",
};

export const statusLabels: Record<ClassMemberStatus, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
};

export const roleOptions: ClassMemberRole[] = [
  "KETUA_KELAS",
  "WAKIL_KETUA_KELAS",
  "SEKRETARIS",
  "BENDAHARA_1",
  "BENDAHARA_2",
  "ANGGOTA",
];

export const statusOptions: ClassMemberStatus[] = ["ONLINE", "OFFLINE"];
