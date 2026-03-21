import React, { useContext, useState, useEffect, useMemo } from "react";
import { formatNumber } from "../utils/formatNumber";
import { AntDesign } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import {
  container,
  accounts__block,
  accounts__header,
  body,
  green_line,
  accounts__add,
  account,
  caption1,
  setting_option,
  subheadline,
  h1,
  input,
  blue,
  submit_button,
  submit_button_text,
  colors,
  font,
  size,
  accounts__body,
} from "../styles/styles";
import { AccountsContext } from "../context/AccountsContext";
import { UsersContext } from "../context/UsersContext";
import { Account, AccountFormData } from "../src/types";

interface DashboardItem {
  _id: string;
  title?: string;
  type: string;
  name?: string;
  balance?: number;
  currency?: string;
  icon?: { color: string; icon_value: string };
  subcategories?: import("../src/types").Subcategory[];
}

function Dashboard({ navigation }: { navigation: any }) {
  const {
    getAccountsOfUser,
    accounts,
    setActiveAccount,
    setType,
    setAccountData,
    randomColor,
    activeAccount,
    type,
  } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);

  useEffect(() => {
    if (user) {
      getAccountsOfUser();
      setActiveAccount(null);
    }
  }, []);

  const Accounts = useMemo<DashboardItem[]>(
    () => [
      ...(accounts as DashboardItem[]),
      { _id: "income", title: "New account", type: "income" },
      { _id: "personal", title: "New account", type: "personal" },
      { _id: "expense", title: "New account", type: "expense" },
    ],
    [accounts]
  );

  const Item = ({
    item,
    onPress,
  }: {
    item: DashboardItem;
    onPress: () => void;
  }) =>
    item.title === "New account" ? (
      <TouchableOpacity
        onPress={onPress}
        style={[accounts__add, { backgroundColor: colors.darkGray }]}
      >
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>
    ) : (
      <View style={account}>
        <TouchableOpacity
          onPress={onPress}
          style={[
            accounts__add,
            { backgroundColor: item.icon?.color || "gray" },
          ]}
        >
          <MaterialCommunityIcons
            name={(item.icon?.icon_value || "wallet-outline") as any}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{ ...caption1, color: colors.gray, fontWeight: font.bold }}
        >
          {item.name}
        </Text>
        <Text style={{ ...caption1, color: "white", fontWeight: font.bold }}>
          {formatNumber(item.balance ?? 0)} {item.currency}
        </Text>
      </View>
    );

  const handleCurrentAccount = (accountId: string, itemType: string) => {
    setActiveAccount(accounts.find((acc) => acc._id === accountId) || null);
    navigation.navigate("Account", { type: itemType });
  };

  const renderItem = ({ item }: { item: DashboardItem }) => {
    return (
      <Item
        item={item}
        onPress={() =>
          item.title === "New account"
            ? (setActiveAccount(null),
              setAccountData({
                name: "",
                subcategories: [],
                ownerId: user?.id,
                type: item.type,
                icon: {
                  color: randomColor,
                  icon_value: "credit-card-outline",
                },
              }),
              setType(item.type),
              navigation.navigate("Add new account"))
            : (handleCurrentAccount(item._id, item.type), setType("edit"))
        }
      />
    );
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background, padding: 20 }}>
      <View
        style={[
          styles.container,
          { justifyContent: "flex-start", minHeight: "100%" },
        ]}
      >
        <View style={accounts__block}>
          <View style={accounts__header}>
            <Text style={body}>Income</Text>
            <Text style={body}>
              {formatNumber(
                Accounts.filter(
                  (acc) => acc.type === "income" && acc._id !== "income"
                ).reduce(
                  (accumulator, acc) => accumulator + (acc.balance ?? 0),
                  0
                )
              )}{" "}
              {user?.currency}
            </Text>
          </View>
          <View style={green_line} />
          <FlatList
            scrollEnabled={false}
            style={accounts__body}
            data={Accounts.filter((acc) => acc.type === "income")}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            numColumns={5}
          />
        </View>
        <View style={accounts__block}>
          <View style={accounts__header}>
            <Text style={body}>Personal</Text>
            <Text style={body}>
              {formatNumber(
                Accounts.filter(
                  (acc) => acc.type === "personal" && acc._id !== "personal"
                ).reduce(
                  (accumulator, acc) => accumulator + (acc.balance ?? 0),
                  0
                )
              )}{" "}
              {user?.currency}
            </Text>
          </View>
          <View style={green_line} />
          <FlatList
            scrollEnabled={false}
            style={accounts__body}
            data={Accounts.filter((acc) => acc.type === "personal")}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            numColumns={5}
          />
        </View>
        <View style={accounts__block}>
          <View style={accounts__header}>
            <Text style={body}>Expenses</Text>
            <Text style={body}>
              {formatNumber(
                Accounts.filter(
                  (acc) => acc.type === "expense" && acc._id !== "expense"
                ).reduce(
                  (accumulator, acc) => accumulator + (acc.balance ?? 0),
                  0
                )
              )}{" "}
              {user?.currency}
            </Text>
          </View>
          <View style={green_line} />
          <FlatList
            scrollEnabled={false}
            style={accounts__body}
            data={Accounts.filter((acc) => acc.type === "expense")}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            numColumns={5}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = {
  container,
};

export default Dashboard;
