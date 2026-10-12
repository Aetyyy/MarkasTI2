import "server-only";
import { prisma } from "@/libs/prisma";
import type { CashTransaction } from "@/libs/cash/types";

export async function getCashTransactions(): Promise<CashTransaction[]> {
  const [income, expense] = await Promise.all([
    prisma.kasMasuk.findMany({
      include: { paidBy: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.kasKeluar.findMany({
      include: { approvedBy: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return [
    ...income.map((item) => ({
      id: `IN:${item.id}`,
      type: "INCOME" as const,
      date: item.date.toISOString().slice(0, 10),
      title: item.description,
      amount: Number(item.amount),
      category: "Uang Kas",
      payerName: item.payerName,
      payerNim: item.payerNim,
      method: item.paymentMethod,
      responsible: item.paidBy?.name || "Bendahara",
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    ...expense.map((item) => ({
      id: `OUT:${item.id}`,
      type: "EXPENSE" as const,
      date: item.date.toISOString().slice(0, 10),
      title: item.description,
      amount: Number(item.amount),
      category: item.category,
      payerName: "Kas Kelas",
      payerNim: "-",
      method: "-",
      responsible: item.approvedBy?.name || "Bendahara",
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  ].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    return byDate || b.createdAt.localeCompare(a.createdAt);
  });
}
