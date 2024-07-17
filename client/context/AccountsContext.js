import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { URL } from "../config";
export const AccountsContext = React.createContext();
import { UsersContext } from "./UsersContext";

export const AccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState([]);
  const [recipientAccount, setRecipientAccount] = useState({});
  const [randomColor, setRandomColor] = useState("gray");
  const { user } = useContext(UsersContext);

  const getAccountsOfUser = async () => {
    try {
      const response = await axios.get(`${URL}/accounts/getall/${user.id}`);

      setAccounts(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const iconColors = [
    "#FF7070",
    "#FF2424",
    "#FF8824",
    "#FFBD24",
    "#9F7A25",
    "#A9D41E",
    "#58D41E",
    "#2CBD6F",
    "#2CBDAB",
    "#00DAFF",
    "#0077FF",
    "#00438F",
    "#071853",
    "#8C71FF",
    "#3000FF",
    "#B46DFF",
    "#AA00FF",
    "#A700BF",
    "#DE36B7",
    "#DE3657",
    "#FF0032",
    "#9C0000",
    "#717171",
    "#000000",
  ];

  const getRandomColor = () => {
    let randomindex = Math.floor(Math.random() * iconColors.length);
    setRandomColor(iconColors[randomindex])
  };

  const setBalance = async () => {
    try {
      const response = await axios.post(`${URL}/accounts/setBalance/`, {
        userId: user.id,
        senderId: activeAccount._id,
        recipientId: recipientAccount._id,
      });
      getAccountsOfUser();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        setAccounts,
        getAccountsOfUser,
        setActiveAccount,
        activeAccount,
        setBalance,
        setRecipientAccount,
        recipientAccount,
        iconColors,
        getRandomColor,
        randomColor,
        setRandomColor
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};
