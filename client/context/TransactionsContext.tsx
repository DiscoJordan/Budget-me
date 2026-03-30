import React, { useState, useContext, ReactNode } from "react";
import { UsersContext } from "./UsersContext";
import { AccountsContext } from "./AccountsContext";
import axios from "axios";
import { URL } from "../config";
import { Transaction, TransactionsContextType } from "../src/types";

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
  const { getAccountsOfUser } = useContext(AccountsContext);

  const getTransactionsOfUser = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${URL}/transactions/getall/${user?.id}`
      );
      setTransactions(response.data.data);
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
      const response = await axios.post(`${URL}/transactions/updateTransaction`, {
        transactionId: id,
        ...fields,
      });
      if (response.data.ok) {
        await Promise.all([getTransactionsOfUser(), getAccountsOfUser()]);
        return true;
      }
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const deleteAllTransactions = async (): Promise<boolean> => {
    try {
      const response = await axios.post(`${URL}/transactions/deleteAllTransactions`, {
        ownerId: user?.id,
      });
      if (response.data.ok) {
        setTransactions([]);
        await getAccountsOfUser();
        return true;
      }
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${URL}/transactions/deleteTransaction`, {
        transactionId: id,
      });
      if (response.data.ok) {
        await Promise.all([getTransactionsOfUser(), getAccountsOfUser()]);
        return true;
      }
      return false;
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
