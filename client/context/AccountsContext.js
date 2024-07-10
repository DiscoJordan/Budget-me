import React, { useEffect, useState } from "react";
import axios from "axios";
import { URL } from "../config";
export const AccountsContext = React.createContext();

export const AccountsProvider = ({ children }) => {

  return (
    <AccountsContext.Provider
      value={{
       
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};
