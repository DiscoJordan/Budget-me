import React, { useEffect, useState, useContext } from "react";
import { UsersContext } from "./UsersContext";
import axios from "axios";
import { URL } from "../config";
export const TransactionsContext = React.createContext();

export const TransactionsProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  // const [activeTransaction, setActiveTransaction] = useState([]);
  const {user} = useContext(UsersContext);

  const getTransactionsOfUser = async () => {
    
    try {
      const response = await axios.get(`${URL}/transactions/getall/${user.id}`);
      setTransactions(response.data.data);

    } catch (error) {
      console.log(error.message);
    }
  };
  return (
    <TransactionsContext.Provider
      value={{transactions,setTransactions,getTransactionsOfUser
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};

