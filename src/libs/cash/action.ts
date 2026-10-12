"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { broadcastCashChanged } from "@/libs/cash/realtime";
import { getCashTransactions } from "@/libs/cash/query";
import type { SaveCashInput } from "@/libs/cash/types";
import { prisma } from "@/libs/prisma";

async function requireCashAccess(
  type: SaveCashInput["type"],
  action: "create" | "update",
) {
  const session = await auth();
  if (!session?.user) throw new Error("Kamu harus login terlebih dahulu.");

  const scope =
    type === "INCOME"
      ? PERMISSION_SCOPES.cashIncome
      : PERMISSION_SCOPES.cashExpense;
  const allowed = canAccess(session.user, scope, action);

  if (!allowed) throw new Error("Kamu tidak punya izin mengelola kas.");
  return session.user;
}

function validateInput(input: SaveCashInput) {
  const title = input.title.trim();
  const amount = Math.round(Number(input.amount));
  const date = new Date(`${input.date}T00:00:00.000Z`);

  if (!title) throw new Error("Judul transaksi wajib diisi.");
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Nominal harus lebih dari nol.");
  if (Number.isNaN(date.getTime())) throw new Error("Tanggal tidak valid.");

  return { title, amount: BigInt(amount), date };
}

export async function getCashLedgerAction() {
  return getCashTransactions();
}

export async function saveCashTransactionAction(input: SaveCashInput) {
  try {
    const isEditing = Boolean(input.id);
    const user = await requireCashAccess(
      input.type,
      isEditing ? "update" : "create",
    );
    const valid = validateInput(input);
    let transactionId = "";

    if (input.type === "INCOME") {
      const data = {
        payerName: input.payerName.trim() || "Tidak diketahui",
        payerNim: input.payerNim.trim() || "-",
        amount: valid.amount,
        description: valid.title,
        paymentMethod: input.method.trim() || "Tunai",
        date: valid.date,
        paidById: user.id,
      };

      if (isEditing) {
        const [prefix, id] = input.id!.split(":");
        if (prefix !== "IN" || !id) throw new Error("Jenis transaksi tidak dapat diubah saat edit.");
        const saved = await prisma.kasMasuk.update({ where: { id }, data });
        transactionId = `IN:${saved.id}`;
      } else {
        const saved = await prisma.kasMasuk.create({ data });
        transactionId = `IN:${saved.id}`;
      }
    } else {
      const data = {
        description: valid.title,
        amount: valid.amount,
        category: input.category.trim() || "Lainnya",
        date: valid.date,
        approvedById: user.id,
      };

      if (isEditing) {
        const [prefix, id] = input.id!.split(":");
        if (prefix !== "OUT" || !id) throw new Error("Jenis transaksi tidak dapat diubah saat edit.");
        const saved = await prisma.kasKeluar.update({ where: { id }, data });
        transactionId = `OUT:${saved.id}`;
      } else {
        const saved = await prisma.kasKeluar.create({ data });
        transactionId = `OUT:${saved.id}`;
      }
    }

    revalidatePath("/transkrip-kas");
    broadcastCashChanged(transactionId);

    return { ok: true, message: "Transaksi kas berhasil disimpan." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan transaksi.",
    };
  }
}
