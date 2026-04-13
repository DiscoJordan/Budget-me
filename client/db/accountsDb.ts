import { getDB } from "./database";
import { Account, AccountFormData } from "../src/types";
import uuid from "react-native-uuid";

interface AccountRow {
  _id: string;
  ownerId: string;
  name: string;
  type: string;
  balance: number;
  initialBalance: number;
  currency: string;
  icon_color: string;
  icon_value: string;
  subcategories: string;
  archived: number;
  isMultiAccount: number;
  isMainSubAccount: number;
  parentId: string | null;
  budgets: string | null;
  time: string | null;
}

function rowToAccount(row: AccountRow): Account {
  return {
    _id: row._id,
    ownerId: row.ownerId,
    name: row.name,
    type: row.type as Account["type"],
    balance: row.balance,
    initialBalance: row.initialBalance,
    currency: row.currency,
    icon: { color: row.icon_color, icon_value: row.icon_value },
    subcategories: JSON.parse(row.subcategories || "[]"),
    archived: row.archived === 1,
    isMultiAccount: row.isMultiAccount === 1,
    isMainSubAccount: row.isMainSubAccount === 1,
    parentId: row.parentId ?? undefined,
    budgets: row.budgets ? JSON.parse(row.budgets) : undefined,
    time: row.time ?? undefined,
  };
}

export async function getAllAccounts(ownerId: string): Promise<Account[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<AccountRow>(
    "SELECT * FROM accounts WHERE ownerId = ?",
    [ownerId]
  );
  return rows.map(rowToAccount);
}

export async function upsertAccount(account: Account | AccountFormData & { _id?: string; ownerId?: string; balance?: number; initialBalance?: number }): Promise<string> {
  const db = await getDB();
  const id = (account as any)._id || (uuid.v4() as string);
  await db.runAsync(
    `INSERT OR REPLACE INTO accounts
      (_id, ownerId, name, type, balance, initialBalance, currency, icon_color, icon_value,
       subcategories, archived, isMultiAccount, isMainSubAccount, parentId, budgets, time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      (account as any).ownerId ?? "",
      account.name,
      account.type,
      (account as any).balance ?? 0,
      (account as any).initialBalance ?? 0,
      (account as any).currency ?? "USD",
      account.icon?.color ?? "#717171",
      account.icon?.icon_value ?? "credit-card-outline",
      JSON.stringify((account as any).subcategories ?? []),
      (account as any).archived ? 1 : 0,
      (account as any).isMultiAccount ? 1 : 0,
      (account as any).isMainSubAccount ? 1 : 0,
      (account as any).parentId ?? null,
      (account as any).budgets ? JSON.stringify((account as any).budgets) : null,
      (account as any).time ?? null,
    ]
  );
  return id;
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync("DELETE FROM accounts WHERE _id = ?", [id]);
}

export async function updateAccountBalance(id: string, balance: number): Promise<void> {
  const db = await getDB();
  await db.runAsync("UPDATE accounts SET balance = ? WHERE _id = ?", [balance, id]);
}

export async function deleteAllAccounts(ownerId: string): Promise<void> {
  const db = await getDB();
  await db.runAsync("DELETE FROM accounts WHERE ownerId = ?", [ownerId]);
}
