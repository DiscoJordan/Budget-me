import { getDB } from "./database";
import { Transaction } from "../src/types";
import uuid from "react-native-uuid";

interface TransactionRow {
  _id: string;
  ownerId: string;
  senderId: string;
  recipientId: string;
  icon_color: string;
  icon_value: string;
  subcategory: string;
  amount: number;
  currency: string;
  time: string;
  rate: number;
  comment: string;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    _id: row._id,
    ownerId: row.ownerId,
    senderId: row.senderId,
    recipientId: row.recipientId,
    icon: { color: row.icon_color, icon_value: row.icon_value },
    subcategory: row.subcategory,
    amount: row.amount,
    currency: row.currency,
    time: row.time,
    rate: row.rate,
    comment: row.comment,
  };
}

export async function getAllTransactions(ownerId: string): Promise<Transaction[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<TransactionRow>(
    "SELECT * FROM transactions WHERE ownerId = ? ORDER BY time DESC",
    [ownerId]
  );
  return rows.map(rowToTransaction);
}

export async function upsertTransaction(tx: Omit<Transaction, "_id"> & { _id?: string }): Promise<string> {
  const db = await getDB();
  const id = tx._id || (uuid.v4() as string);
  await db.runAsync(
    `INSERT OR REPLACE INTO transactions
      (_id, ownerId, senderId, recipientId, icon_color, icon_value,
       subcategory, amount, currency, time, rate, comment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tx.ownerId as string,
      tx.senderId as string,
      tx.recipientId as string,
      tx.icon?.color ?? "#717171",
      tx.icon?.icon_value ?? "credit-card-outline",
      tx.subcategory ?? "",
      tx.amount,
      tx.currency,
      tx.time,
      tx.rate ?? 1,
      tx.comment ?? "",
    ]
  );
  return id;
}

export async function deleteTransactionById(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync("DELETE FROM transactions WHERE _id = ?", [id]);
}

export async function deleteAllTransactionsByOwner(ownerId: string): Promise<void> {
  const db = await getDB();
  await db.runAsync("DELETE FROM transactions WHERE ownerId = ?", [ownerId]);
}

export async function getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<TransactionRow>(
    "SELECT * FROM transactions WHERE senderId = ? OR recipientId = ? ORDER BY time DESC",
    [accountId, accountId]
  );
  return rows.map(rowToTransaction);
}
