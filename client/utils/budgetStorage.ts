// import axios from "axios";
// import { URL } from "../config";
import { PeriodType } from "../context/AccountingPeriodContext";
import { Account } from "../src/types";
import { getAllAccounts, upsertAccount } from "../db/accountsDb";

export function getBudgetFromAccount(
  account: Account,
  periodType: PeriodType,
): number {
  return account.budgets?.[periodType] ?? 0;
}

export function getAllBudgetsFromAccounts(
  accounts: Account[],
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const acc of accounts) {
    if (acc.budgets && Object.keys(acc.budgets).length > 0) {
      result[acc._id] = acc.budgets;
    }
  }
  return result;
}

export async function setBudget(
  accountId: string,
  periodType: PeriodType,
  amount: number,
  ownerId: string,
): Promise<void> {
  // ─── OFFLINE-FIRST: replaced API call with SQLite ───────────────────────
  // await axios.post(`${URL}/accounts/updateaccount`, { accountData: { _id: accountId, [`budgets.${periodType}`]: amount } });
  const accounts = await getAllAccounts(ownerId);
  const account = accounts.find((a) => a._id === accountId);
  if (!account) return;
  const updatedBudgets = { ...(account.budgets ?? {}), [periodType]: amount };
  await upsertAccount({ ...account, budgets: updatedBudgets });
}
