export type CashTransactionType = "INCOME" | "EXPENSE";

export type CashTransaction = {
  id: string;
  type: CashTransactionType;
  date: string;
  title: string;
  amount: number;
  category: string;
  payerName: string;
  payerNim: string;
  method: string;
  responsible: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveCashInput = {
  id?: string;
  type: CashTransactionType;
  date: string;
  title: string;
  amount: number;
  category: string;
  payerName: string;
  payerNim: string;
  method: string;
};
