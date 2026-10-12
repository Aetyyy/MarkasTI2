import { auth } from "@/auth";
import { getCrudAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { getCashTransactions } from "@/libs/cash/query";
import CashLedgerClient from "./cashLedgerClient";

export const dynamic = "force-dynamic";

export default async function CashTranscriptPage() {
  const [session, transactions] = await Promise.all([
    auth(),
    getCashTransactions(),
  ]);

  const incomeAccess = getCrudAccess(
    session?.user,
    PERMISSION_SCOPES.cashIncome,
  );
  const expenseAccess = getCrudAccess(
    session?.user,
    PERMISSION_SCOPES.cashExpense,
  );

  return (
    <CashLedgerClient
      initialTransactions={transactions}
      canCreate={incomeAccess.create || expenseAccess.create}
      canUpdate={incomeAccess.update || expenseAccess.update}
    />
  );
}
