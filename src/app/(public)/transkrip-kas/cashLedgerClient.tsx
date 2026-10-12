"use client";

import { useEffect, useMemo, useState } from "react";
import { showError, showSuccess } from "@/libs/swal";
import * as XLSX from "xlsx-js-style";
import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiEdit3,
  FiDownload,
  FiPlus,
  FiPrinter,
  FiRefreshCcw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import {
  getCashLedgerAction,
  saveCashTransactionAction,
} from "@/libs/cash/action";
import type {
  CashTransaction,
  CashTransactionType,
  SaveCashInput,
} from "@/libs/cash/types";

type Props = {
  initialTransactions: CashTransaction[];
  canCreate: boolean;
  canUpdate: boolean;
};

const emptyForm: SaveCashInput = {
  type: "INCOME",
  date: new Date().toISOString().slice(0, 10),
  title: "",
  amount: 0,
  category: "Uang Kas",
  payerName: "",
  payerNim: "",
  method: "Transfer",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function CashModal({
  form,
  setForm,
  saving,
  onClose,
  onSave,
}: {
  form: SaveCashInput;
  setForm: (form: SaveCashInput) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const editing = Boolean(form.id);

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-4xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-blue-700">
              {editing ? "Edit Transaksi" : "Transaksi Baru"}
            </span>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              {form.type === "INCOME" ? "Pemasukan Kas" : "Pengeluaran Kas"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600"
          >
            <FiX />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-black text-blue-700">
              JENIS
            </span>
            <select
              value={form.type}
              disabled={editing}
              onChange={(event) =>
                setForm({
                  ...form,
                  type: event.target.value as CashTransactionType,
                })
              }
              className="w-full rounded-2xl border border-blue-100 px-4 py-3 font-bold outline-none disabled:bg-slate-100"
            >
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-blue-700">
              TANGGAL
            </span>
            <input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm({ ...form, date: event.target.value })
              }
              className="w-full rounded-2xl border border-blue-100 px-4 py-3 font-bold outline-none"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-black text-blue-700">
              JUDUL / KETERANGAN
            </span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Contoh: Uang kas minggu pertama"
              className="w-full rounded-2xl border border-blue-100 px-4 py-3 font-bold outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-blue-700">
              NOMINAL
            </span>
            <input
              type="number"
              min="1"
              value={form.amount || ""}
              onChange={(event) =>
                setForm({ ...form, amount: Number(event.target.value) })
              }
              className="w-full rounded-2xl border border-blue-100 px-4 py-3 font-bold outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-blue-700">
              KATEGORI
            </span>
            <input
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
              className="w-full rounded-2xl border border-blue-100 px-4 py-3 font-bold outline-none"
            />
          </label>

          {form.type === "INCOME" && (
            <>
              <label className="block">
                <span className="mb-2 block text-xs font-black text-blue-700">
                  NAMA PEMBAYAR
                </span>
                <input
                  value={form.payerName}
                  onChange={(event) =>
                    setForm({ ...form, payerName: event.target.value })
                  }
                  className="w-full rounded-2xl border border-blue-100 px-4 py-3 font-bold outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black text-blue-700">
                  NIM
                </span>
                <input
                  value={form.payerNim}
                  onChange={(event) =>
                    setForm({ ...form, payerNim: event.target.value })
                  }
                  className="w-full rounded-2xl border border-blue-100 px-4 py-3 font-bold outline-none"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-black text-blue-700">
                  METODE
                </span>
                <select
                  value={form.method}
                  onChange={(event) =>
                    setForm({ ...form, method: event.target.value })
                  }
                  className="w-full rounded-2xl border border-blue-100 px-4 py-3 font-bold outline-none"
                >
                  <option>Transfer</option>
                  <option>Tunai</option>
                  <option>QRIS</option>
                </select>
              </label>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-blue-100 px-5 py-3 text-sm font-black text-blue-700"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CashLedgerClient({
  initialTransactions,
  canCreate,
  canUpdate,
}: Props) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"ALL" | CashTransactionType>("ALL");
  const [form, setForm] = useState<SaveCashInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setTransactions(await getCashLedgerAction());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const source = new EventSource("/api/realtime/cash");
    source.onmessage = () => void refresh();
    return () => source.close();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return transactions.filter((item) => {
      if (type !== "ALL" && item.type !== type) return false;
      if (!keyword) return true;
      return [item.title, item.payerName, item.payerNim, item.category]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [query, transactions, type]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "INCOME")
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions
      .filter((item) => item.type === "EXPENSE")
      .reduce((sum, item) => sum + item.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const editTransaction = (item: CashTransaction) => {
    setForm({
      id: item.id,
      type: item.type,
      date: item.date,
      title: item.title,
      amount: item.amount,
      category: item.category,
      payerName: item.payerName === "Kas Kelas" ? "" : item.payerName,
      payerNim: item.payerNim === "-" ? "" : item.payerNim,
      method: item.method === "-" ? "Tunai" : item.method,
    });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const result = await saveCashTransactionAction(form);
      if (!result.ok) {
        await showError("Gagal", result.message);
        return;
      }
      setForm(null);
      await refresh();
      await showSuccess("Berhasil", result.message);
    } finally {
      setSaving(false);
    }
  };

  const printTranscript = () => {
    window.print();
  };

  const exportExcel = () => {
    const rows = filtered.map((item, index) => ({
      No: index + 1,
      Tanggal: item.date,
      Jenis: item.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
      Transaksi: item.title,
      Kategori: item.category,
      Nama: item.payerName,
      NIM: item.payerNim,
      Metode: item.method,
      Nominal: item.amount,
      "Penanggung Jawab": item.responsible,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 14 },
      { wch: 32 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 24 },
    ];

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:J1");
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: column })];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2563EB" } },
          alignment: { horizontal: "center" },
        };
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Transkrip Kas");
    XLSX.writeFile(
      workbook,
      `transkrip-kas-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <main className="app-page-canvas min-h-screen px-[var(--app-page-gutter)] pb-16 pt-32">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-4xl border border-white/80 bg-white/80 p-6 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                Kas Realtime
              </span>
              <h1 className="mt-5 text-3xl font-black text-slate-950 md:text-5xl">
                Transkrip Uang Kas
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Pemasukan dan pengeluaran kelas dari database, diperbarui
                otomatis untuk semua pengguna.
              </p>
            </div>
            <div className="no-print flex flex-wrap gap-2">
              <button
                type="button"
                onClick={printTranscript}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/55 px-5 py-3 text-sm font-black text-slate-700 shadow-sm backdrop-blur-xl"
              >
                <FiPrinter /> Print
              </button>
              <button
                type="button"
                onClick={exportExcel}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-5 py-3 text-sm font-black text-emerald-700 shadow-sm backdrop-blur-xl"
              >
                <FiDownload /> Export Excel
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setForm({ ...emptyForm })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20"
                >
                  <FiPlus /> Tambah Transaksi
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Total Pemasukan",
              value: totals.income,
              Icon: FiArrowUpCircle,
              color: "text-emerald-600",
            },
            {
              label: "Total Pengeluaran",
              value: totals.expense,
              Icon: FiArrowDownCircle,
              color: "text-rose-600",
            },
            {
              label: "Saldo Kas",
              value: totals.balance,
              Icon: FiArrowUpCircle,
              color: "text-blue-600",
            },
          ].map(({ label, value, Icon, color }) => (
            <div
              key={label}
              className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-lg shadow-blue-900/5"
            >
              <Icon className={`h-7 w-7 ${color}`} />
              <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {formatMoney(value)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-4xl border border-white/80 bg-white/85 p-4 shadow-xl shadow-blue-900/5">
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari transaksi..."
                className="w-full rounded-2xl border border-blue-100 py-3 pl-11 pr-4 font-bold outline-none"
              />
            </label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
              className="rounded-2xl border border-blue-100 px-4 py-3 font-bold outline-none"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 font-black text-blue-700"
            >
              <FiRefreshCcw className={refreshing ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          </div>

          <div className="cash-print-area mt-4 overflow-x-auto rounded-3xl border border-blue-50">
            <table className="app-table min-w-full">
              <thead className="bg-blue-50 text-xs font-black uppercase tracking-wider text-blue-700">
                <tr>
                  <th className="px-4 py-4">Tanggal</th>
                  <th className="px-4 py-4">Transaksi</th>
                  <th className="px-4 py-4">Pihak</th>
                  <th className="px-4 py-4">Nominal</th>
                  <th className="px-4 py-4">Penanggung Jawab</th>
                  {canUpdate && <th className="px-4 py-4">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-blue-50/40">
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-600">
                      {item.date}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.category}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{item.payerName}</p>
                      <p className="text-xs text-slate-500">{item.payerNim}</p>
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-4 font-black ${item.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {item.type === "INCOME" ? "+" : "-"}
                      {formatMoney(item.amount)}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-600">
                      {item.responsible}
                    </td>
                    {canUpdate && (
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => editTransaction(item)}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-2 text-xs font-black text-blue-700"
                        >
                          <FiEdit3 /> Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="p-10 text-center text-sm font-bold text-slate-500">
                Belum ada transaksi kas.
              </p>
            )}
          </div>
        </div>
      </section>

      {form && (
        <CashModal
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setForm(null)}
          onSave={() => void save()}
        />
      )}
    </main>
  );
}
