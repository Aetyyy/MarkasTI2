import { prisma } from "./prisma";
import type { Dosen } from "./types";

const normalizeDosen = (d: any): Dosen => ({
  id: d.id,
  name: d.name,
  nip: d.nip || undefined,
  email: d.email || undefined,
  phone: d.phone || undefined,
  address: d.address || undefined,
  createdAt: d.createdAt,
});

export async function getAllDosen(): Promise<Dosen[]> {
  const data = await prisma.dosen.findMany({ orderBy: { name: "asc" } });
  return data.map(normalizeDosen);
}

export async function getDosenById(id: number): Promise<Dosen | null> {
  const data = await prisma.dosen.findUnique({ where: { id } });
  return data ? normalizeDosen(data) : null;
}

export async function createDosen(data: Omit<Dosen, "id" | "createdAt">): Promise<Dosen> {
  const result = await prisma.dosen.create({ data });
  return normalizeDosen(result);
}

export async function updateDosen(id: number, data: Partial<Omit<Dosen, "id">>): Promise<Dosen | null> {
  const result = await prisma.dosen.update({ where: { id }, data });
  return normalizeDosen(result);
}

export async function deleteDosen(id: number): Promise<boolean> {
  try {
    await prisma.dosen.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
