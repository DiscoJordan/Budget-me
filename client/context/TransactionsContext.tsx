import React, { useState, useContext, ReactNode } from "react";
import { UsersContext } from "./UsersContext";
import { AccountsContext } from "./AccountsContext";
// import axios from "axios";
// import { URL } from "../config";
import { Transaction, TransactionsContextType } from "../src/types";
import {
  getAllTransactions,
  upsertTransaction,
  deleteTransactionById,
  deleteAllTransactionsByOwner,
} from "../db/transactionsDb";

export const TransactionsContext =
  React.createContext<TransactionsContextType>({} as TransactionsContextType);

interface TransactionsProviderProps {
  children: ReactNode;
}

export const TransactionsProvider = ({
  children,
}: TransactionsProviderProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const { user } = useContext(UsersContext);
  const { getAccountsOfUser, setBalance } = useContext(AccountsContext);

  const getTransactionsOfUser = async (): Promise<void> => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // ─── OFFLINE-FIRST: replaced API call with SQLite ───────────────────────
      // const response = await axios.get(`${URL}/transactions/getall/${user?.id}`);
      // setTransactions(response.data.data);
      const txs = await getAllTransactions(user.id);
      setTransactions(txs);
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (
    id: string,
    fields: Partial<Transaction & { senderId: string; recipientId: string }>
  ): Promise<boolean> => {
    try {
      // ─── OFFLINE-FIRST: replaced API call with SQLite ───────────────────────
      // const response = await axios.post(`${URL}/transactions/updateTransaction`, { transactionId: id, ...fields });
      // if (response.data.ok) { ... }
      const existing = transactions.find((t) => t._id === id);
      if (!existing) return false;
      const updated: Transaction = {
        ...existing,
        ...fields,
        _id: id,
      };
      await upsertTransaction(updated);
      const senderId = (updated.senderId as any)?._id ?? updated.senderId as string;
      const recipientId = (updated.recipientId as any)?._id ?? updated.recipientId as string;
      await setBalance(senderId, recipientId);
      await getTransactionsOfUser();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const deleteAllTransactions = async (): Promise<boolean> => {
    try {
      // ─── OFFLINE-FIRST: replaced API call with SQLite ───────────────────────
      // const response = await axios.post(`${URL}/transactions/deleteAllTransactions`, { ownerId: user?.id });
      if (!user?.id) return false;
      await deleteAllTransactionsByOwner(user.id);
      setTransactions([]);
      // Reset all account balances to initialBalance (no transactions left)
      const { getAllAccounts, updateAccountBalance } = await import("../db/accountsDb");
      const accts = await getAllAccounts(user.id);
      for (const acc of accts) {
        const resetBalance = acc.type === "income" ? -(acc.initialBalance) : acc.initialBalance;
        await updateAccountBalance(acc._id, Math.round(resetBalance * 100) / 100);
      }
      await getAccountsOfUser();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      // ─── OFFLINE-FIRST: replaced API call with SQLite ───────────────────────
      // const response = await axios.post(`${URL}/transactions/deleteTransaction`, { transactionId: id });
      const tx = transactions.find((t) => t._id === id);
      await deleteTransactionById(id);
      if (tx) {
        const senderId = (tx.senderId as any)?._id ?? tx.senderId as string;
        const recipientId = (tx.recipientId as any)?._id ?? tx.recipientId as string;
        await setBalance(senderId, recipientId);
      }
      await getTransactionsOfUser();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        setTransactions,
        getTransactionsOfUser,
        loading,
        activeTransaction,
        setActiveTransaction,
        updateTransaction,
        deleteTransaction,
        deleteAllTransactions,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};
