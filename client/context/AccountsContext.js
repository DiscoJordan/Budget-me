import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { URL } from "../config";
export const AccountsContext = React.createContext();
import { UsersContext } from "./UsersContext";
import { Alert } from "react-native";
import uuid from "react-native-uuid";


export const AccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [type, setType] = useState('');
  const { user } = useContext(UsersContext);
  const [activeAccount, setActiveAccount] = useState([]);
  const [recipientAccount, setRecipientAccount] = useState({});
  const iconColors = [
    "#FF7070", "#FF2424","#FF8824","#FFBD24",
    "#9F7A25", "#A9D41E","#58D41E", "#2CBD6F","#2CBDAB",
    "#00DAFF", "#0077FF","#00438F","#071853","#8C71FF",
    "#3000FF","#B46DFF","#AA00FF", "#A700BF", "#DE36B7",
    "#DE3657","#FF0032", "#9C0000","#717171", "#000000",
  ];

  const iconValues = [
    "credit-card-outline", "credit-card-fast-outline","credit-card-remove-outline","credit-card-wireless",
    "wallet-giftcard", "smart-card-reader-outline","access-point", "account-cash-outline","account-circle-outline",
    "account-heart-outline", "account-lock","airplane","alarm-light-outline","alarm-panel-outline",
    "alert","alert-circle-outline","align-vertical-bottom", "ambulance", "arm-flex-outline",
    "axe-battle","baby-carriage", "badminton","bag-suitcase-outline", "baguette","bank-outline","barley","basket","beer-outline","bicycle","bitcoin","book-account-outline", "bookmark-multiple-outline","border-color","bus","bottle-wine-outline","bullseye-arrow","calculator-variant","camera","car","cart","cart-variant","cash","cash-100","cigar","coffee","currency-btc","currency-eur","currency-kzt","currency-rub","currency-usd","delete-outline","desktop-mac","diamond-stone","dog-side","dumbbell","ethereum","eye-outline","fish","flower-outline","food","food-apple","fuel","garage","gift-open","glass-mug-variant","heart","image-multiple","instagram","liquor","microphone-variant","movie-open-play","music","passport","pasta","paw","phone","piggy-bank","pill","plus-thick","power-plug","sack","sack-percent","safe-square","sale","scale-unbalanced","school","security","shower","silverware-fork-knife","sim","slot-machine","smoking","store","subway","ticket-percent","tooth","truck","wallet","web","beach","water",
  ];

  let  randomColor = iconColors[Math.floor(Math.random() * iconColors.length)]

  const getRandomColor =()=>{
    randomColor = iconColors[Math.floor(Math.random() * iconColors.length)]
    setAccountData({
      ...accountData,
      icon: { icon_value:activeAccount?.icon?.icon_value || 'credit-card-outline', color: activeAccount?.icon?.color || randomColor },ownerId: user?.id, type:type,
    })
  }

  const [accountData, setAccountData] = useState({
    name: "",
    subcategories: activeAccount?.accounts||[],
    ownerId: user?.id,
    type: activeAccount?.type || type,
    icon: {
      color: activeAccount?.icon?.color || randomColor,
      icon_value: activeAccount?.icon?.icon_value || "credit-card-outline",
    }});


  const getAccountsOfUser = async () => {
    try {
      const response = await axios.get(`${URL}/accounts/getall/${user.id}`);

      setAccounts(response.data.data);
    } catch (error) {
      console.log(error);
    }
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

  const createSubcatAlert = () =>
    Alert.prompt(
      "New subcategory",
      "Enter your new subcategory below",
      [
        { text: "Cancel", style: "destructive", onPress: () => {} },
        {
          text: "Submit",
          onPress: (subcategory) => {
            if (subcategory.length > 0) {
              let newData = { ...accountData };
              newData.subcategories.push({
                subcategory: subcategory,
                id: uuid.v4(),
              });
              setAccountData(newData);
            }
          },
        },
      ],
      "plain-text"
    );




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
        iconValues,
        setAccountData,
        accountData,
        setType,
        type,
        createSubcatAlert,
        
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};
