import React, { useEffect, useState, useContext} from "react";
import axios from "axios";
import { URL } from "../config";
export const AccountsContext = React.createContext();
import { UsersContext } from "./UsersContext";

export const AccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const {user} = useContext(UsersContext);

  const getAccountsOfUser = async () => {
    
    try {
      const response = await axios.get(`${URL}/accounts/getall/${user.id}`);
      setAccounts(response.data.data);
    } catch (error) {
      console.log(error);

    }
  };


  return (
    <AccountsContext.Provider value={{accounts,setAccounts,getAccountsOfUser }}>{children}</AccountsContext.Provider>
  );
};
