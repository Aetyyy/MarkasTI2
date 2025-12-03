import { prisma } from "./prisma";
import type { KasKeluar } from "./types";

const normalizeKasKeluar = (k: any): KasKeluar => ({
  id: k.id,
  description: k.description,
  amount: Number(k.amount),
  category: k.category,
  date: k.date.toISOString().split('T')[0],
  approvedBy: k.approvedBy || undefined,
  createdAt: k.createdAt,
});

export async function getAllKasKeluar(): Promise<KasKeluar[]> {
  const data = await prisma.kasKeluar.findMany({ orderBy: { date: "desc" } });
  return data.map(normalizeKasKeluar);
}

export async function getKasKeluarById(id: number): Promise<KasKeluar | null> {
  const data = await prisma.kasKeluar.findUnique({ where: { id } });
  return data ? normalizeKasKeluar(data) : null;
}

export async function createKasKeluar(data: Omit<KasKeluar, "id" | "createdAt">): Promise<KasKeluar> {
  const result = await prisma.kasKeluar.create({
    data: {
      description: data.description,
      amount: BigInt(data.amount),
      category: data.category,
      date: new Date(data.date),
      approvedBy: data.approvedBy,
    },
  });
  return normalizeKasKeluar(result);
}

export async function getTotalKasKeluar(dateFrom?: string, dateTo?: string): Promise<number> {
  const result = await prisma.kasKeluar.aggregate({
    _sum: { amount: true },
    where: {
      ...(dateFrom && dateTo && {
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      }),
    },
  });
  return Number(result._sum.amount || 0);
}
