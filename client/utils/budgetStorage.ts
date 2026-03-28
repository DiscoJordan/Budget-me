import axios from "axios";
import { URL } from "../config";
import { PeriodType } from "../context/AccountingPeriodContext";
import { Account } from "../src/types";

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
): Promise<void> {
  await axios.post(`${URL}/accounts/updateaccount`, {
    accountData: {
      _id: accountId,
      [`budgets.${periodType}`]: amount,
    },
  });
}
