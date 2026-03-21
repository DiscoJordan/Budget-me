import React, { useState, useContext, ReactNode } from "react";
import { UsersContext } from "./UsersContext";
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
  const { user } = useContext(UsersContext);

  const getTransactionsOfUser = async (): Promise<void> => {
    try {
      const response = await axios.get(
        `${URL}/transactions/getall/${user?.id}`
      );
      setTransactions(response.data.data);
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
    }
  };

  return (
    <TransactionsContext.Provider
      value={{ transactions, setTransactions, getTransactionsOfUser }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};
