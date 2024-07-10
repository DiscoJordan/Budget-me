import React, { useEffect, useState } from "react";
import axios from "axios";
import { URL } from "../config";
export const TransactionsContext = React.createContext();

export const TransactionsProvider = ({ children }) => {

  return (
    <TransactionsContext.Provider
      value={{
       
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};

