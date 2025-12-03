import { prisma } from "./prisma";
import type { KasMasuk } from "./types";
import type { KasMasuk as PrismaKasMasuk } from '@prisma/client';

const normalizeKasMasuk = (k: PrismaKasMasuk): KasMasuk => ({
  id: k.id,
  dosenId: k.dosenId || undefined,
  amount: Number(k.amount),
  description: k.description,
  paymentMethod: k.paymentMethod as "cash" | "transfer" | "qrcode",
  qrcodeData: k.qrcodeData || undefined,
  date: k.date.toISOString().split('T')[0],
  createdAt: k.createdAt,
});

export async function getAllKasMasuk(): Promise<KasMasuk[]> {
  const data = await prisma.kasMasuk.findMany({ orderBy: { date: "desc" } });
  return data.map(normalizeKasMasuk);
}

export async function getKasMasukById(id: number): Promise<KasMasuk | null> {
  const data = await prisma.kasMasuk.findUnique({ where: { id } });
  return data ? normalizeKasMasuk(data) : null;
}

export async function createKasMasuk(data: Omit<KasMasuk, "id" | "createdAt">): Promise<KasMasuk> {
  const result = await prisma.kasMasuk.create({
    data: {
      dosenId: data.dosenId,
      amount: BigInt(data.amount),
      description: data.description,
      paymentMethod: data.paymentMethod,
      qrcodeData: data.qrcodeData,
      date: new Date(data.date),
    },
  });
  return normalizeKasMasuk(result);
}

export async function getTotalKasMasuk(dateFrom?: string, dateTo?: string): Promise<number> {
  const result = await prisma.kasMasuk.aggregate({
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
