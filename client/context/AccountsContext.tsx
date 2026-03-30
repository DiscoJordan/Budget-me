import React, { useEffect, useState, useContext, ReactNode } from "react";
import axios from "axios";
import { URL } from "../config";
import { Alert } from "react-native";
import uuid from "react-native-uuid";
import { UsersContext } from "./UsersContext";
import {
  Account,
  AccountFormData,
  AccountsContextType,
  Subcategory,
} from "../src/types";

export const AccountsContext = React.createContext<AccountsContextType>(
  {} as AccountsContextType,
);

interface AccountsProviderProps {
  children: ReactNode;
}

export const AccountsProvider = ({ children }: AccountsProviderProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [type, setType] = useState<string>("");
  const { user } = useContext(UsersContext);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [recipientAccount, setRecipientAccount] = useState<Partial<Account>>(
    {},
  );

  const iconColors: string[] = [
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

  const iconValues: string[] = [
    "credit-card-outline",
    "credit-card-fast-outline",
    "credit-card-remove-outline",
    "credit-card-wireless",
    "wallet-giftcard",
    "smart-card-reader-outline",
    "access-point",
    "account-cash-outline",
    "account-circle-outline",
    "account-heart-outline",
    "account-lock",
    "airplane",
    "alarm-light-outline",
    "alarm-panel-outline",
    "alert",
    "alert-circle-outline",
    "align-vertical-bottom",
    "ambulance",
    "arm-flex-outline",
    "axe-battle",
    "baby-carriage",
    "badminton",
    "bag-suitcase-outline",
    "baguette",
    "bank-outline",
    "barley",
    "basket",
    "beer-outline",
    "bicycle",
    "bitcoin",
    "book-account-outline",
    "bookmark-multiple-outline",
    "border-color",
    "bus",
    "bottle-wine-outline",
    "bullseye-arrow",
    "calculator-variant",
    "camera",
    "car",
    "cart",
    "cart-variant",
    "cash",
    "cash-100",
    "cigar",
    "coffee",
    "currency-btc",
    "currency-eur",
    "currency-kzt",
    "currency-rub",
    "currency-usd",
    "delete-outline",
    "desktop-classic",
    "diamond-stone",
    "dog-side",
    "dumbbell",
    "ethereum",
    "eye-outline",
    "fish",
    "flower-outline",
    "food",
    "food-apple",
    "fuel",
    "garage",
    "gift-open",
    "glass-mug-variant",
    "heart",
    "image-multiple",
    "instagram",
    "liquor",
    "microphone-variant",
    "movie-open-play",
    "music",
    "passport",
    "pasta",
    "paw",
    "phone",
    "piggy-bank",
    "pill",
    "plus-thick",
    "power-plug",
    "sack",
    "sack-percent",
    "safe-square",
    "sale",
    "scale-unbalanced",
    "school",
    "security",
    "shower",
    "silverware-fork-knife",
    "sim",
    "slot-machine",
    "smoking",
    "store",
    "subway",
    "ticket-percent",
    "tooth",
    "truck",
    "wallet",
    "web",
    "beach",
    "water",
  ];

  const [randomColor, setRandomColor] = React.useState<string>(
    iconColors[Math.floor(Math.random() * iconColors.length)],
  );

  const getRandomColor = (): void => {
    const newColor = iconColors[Math.floor(Math.random() * iconColors.length)];
    setRandomColor(newColor);
    setAccountData({
      ...accountData,
      icon: {
        icon_value: activeAccount?.icon?.icon_value || "credit-card-outline",
        color: activeAccount?.icon?.color || newColor,
      },
      ownerId: user?.id,
      type: type,
    });
  };

  const [accountData, setAccountData] = useState<AccountFormData>({
    name: "",
    subcategories: activeAccount?.subcategories || [],
    ownerId: user?.id,
    type: activeAccount?.type || type,
    icon: {
      color: activeAccount?.icon?.color || randomColor,
      icon_value: activeAccount?.icon?.icon_value || "credit-card-outline",
    },
    currency: "USD",
  });

  useEffect(() => {
    if (activeAccount) {
      setAccountData({
        name: activeAccount.name,
        subcategories: activeAccount.subcategories || [],
        ownerId: user?.id,
        type: activeAccount.type,
        icon: activeAccount.icon || {
          color: randomColor,
          icon_value: "credit-card-outline",
        },
        _id: activeAccount._id,
        balance: activeAccount.balance ?? 0,
        currency: activeAccount.currency ?? "USD",
      });
    }
  }, [activeAccount]);

  useEffect(() => {
    if (!activeAccount) {
      setAccountData((prev) => ({ ...prev, type, ownerId: user?.id }));
    }
  }, [type]);

  const getAccountsOfUser = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get(`${URL}/accounts/getall/${user?.id}`);
      const fresh: Account[] = response.data.data;
      setAccounts(fresh);

      // Sync activeAccount with fresh data (e.g. after editing currency)
      setActiveAccount((prev) => {
        if (!prev) return prev;
        const match = fresh.find((a) => a._id === prev._id);
        return match ?? null;
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const setBalance = async (senderIdOverride?: string, recipientIdOverride?: string): Promise<void> => {
    try {
      await axios.post(`${URL}/accounts/setBalance/`, {
        userId: user?.id,
        senderId: senderIdOverride ?? activeAccount?._id,
        recipientId: recipientIdOverride ?? recipientAccount._id,
      });
      getAccountsOfUser();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteSubAccount = async (subAccountId: string): Promise<void> => {
    try {
      await axios.post(`${URL}/accounts/deleteaccount`, { accountId: subAccountId });
      await getAccountsOfUser();
    } catch (error) {
      console.log(error);
    }
  };

  const toggleArchiveAccount = async (id: string, archived: boolean): Promise<void> => {
    try {
      await axios.post(`${URL}/accounts/updateaccount`, { accountData: { _id: id, archived } });
      setAccounts((prev) =>
        prev.map((acc) => (acc._id === id ? { ...acc, archived } : acc))
      );
    } catch (error) {
      console.log(error);
    }
  };

  const addSubcategoryToAccount = async (accountId: string, subcatName: string): Promise<void> => {
    const account = accounts.find((a) => a._id === accountId);
    if (!account) return;
    const newSubcat: Subcategory = { subcategory: subcatName, id: uuid.v4() as string };
    const updatedSubcategories = [...(account.subcategories || []), newSubcat];
    const updatedAccount = { ...account, subcategories: updatedSubcategories };
    await axios.post(`${URL}/accounts/updateaccount`, { accountData: updatedAccount });
    setAccounts((prev) => prev.map((a) => (a._id === accountId ? updatedAccount : a)));
    if (activeAccount?._id === accountId) setActiveAccount(updatedAccount);
    if (recipientAccount?._id === accountId) setRecipientAccount(updatedAccount);
  };

  const createSubcatAlert = (): void =>
    Alert.prompt(
      "New subcategory",
      "Enter your new subcategory below",
      [
        { text: "Cancel", style: "destructive", onPress: () => {} },
        {
          text: "Submit",
          onPress: (subcategory?: string) => {
            if (subcategory && subcategory.length > 0) {
              const newData: AccountFormData = { ...accountData };
              const newSubcat: Subcategory = {
                subcategory,
                id: uuid.v4() as string,
              };
              newData.subcategories = [...newData.subcategories, newSubcat];
              setAccountData(newData);
            }
          },
        },
      ],
      "plain-text",
    );

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        setAccounts,
        getAccountsOfUser,
        loading,
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
        addSubcategoryToAccount,
        toggleArchiveAccount,
        deleteSubAccount,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};
