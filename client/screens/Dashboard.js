import React, { useContext, useState, useEffect, useMemo } from "react";
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

function Dashboard({ navigation }) {
  const { getAccountsOfUser, accounts, setActiveAccount ,setType,setAccountData,randomColor,activeAccount,type} =
    useContext(AccountsContext);
  const { user } = useContext(UsersContext);

  useEffect(() => {
    if (user) {
      getAccountsOfUser();
      setActiveAccount({})
    }
  }, []);

  const Accounts = useMemo(
    () => [
      ...accounts,
      {
        _id: "income",
        title: "New account",
        type: "income",
      },
      {
        _id: "personal",
        title: "New account",
        type: "personal",
      },
      {
        _id: "expense",
        title: "New account",
        type: "expense",
      },
    ],
    [accounts]
  );

  const Item = ({ item, onPress }) =>
    item.title === "New account" ? (
      <TouchableOpacity
        onPress={onPress}
        style={[accounts__add, { backgroundColor: colors.darkGray }]}
      >
        <AntDesign name="pluscircleo" size={24} color="white" />
      </TouchableOpacity>
    ) : (
      <View style={account}>
        <TouchableOpacity
          onPress={onPress}
          style={[accounts__add, { backgroundColor: item.icon.color }]}
        >
          <MaterialCommunityIcons
            name={item.icon.icon_value}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <Text numberOfLines={1} style={{ ...caption1, color: colors.gray, fontWeight: font.bold}}>
          {item.name}
        </Text>
        <Text style={{ ...caption1, color: "white", fontWeight: font.bold }}>
          {item.balance} {item.currency}
        </Text>
      </View>
    );
  const handleCurrentAccount = (accountId, itemType) => {
    setActiveAccount(accounts.find((acc) => acc._id === accountId));
    navigation.navigate("Account", { type: itemType });
  };
  const renderItem = ({ item }) => {
    return (
      <Item
        item={item}
        onPress={() =>
          item.title === "New account"
            ? (setActiveAccount({}),
            setAccountData({
              name: "",
              subcategories: [],
              ownerId: user?.id,
              type: activeAccount?.type || type,
              icon: {
                color: activeAccount?.icon?.color || randomColor,
                icon_value: activeAccount?.icon?.icon_value || "credit-card-outline",
              },
            }),
            setType(item.type),
              navigation.navigate("Add new account"))
            : (handleCurrentAccount(item._id, item.type),
            setType('edit'))
        }
      />
    );
  };
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View
        style={[
          styles.container,
          { justifyContent: "start", minHeight: "100%",margin:0 },
        ]}
      >
        <View style={accounts__block}>
          <View style={accounts__header}>
            <Text style={body}>Income</Text>
            <Text style={body}>
              {Accounts.filter(
                (acc) => acc.type === "income" && acc._id !== "income"
              ).reduce((accumulator, acc) => accumulator + acc.balance, 0)}{" "}
              {user?.currency}
            </Text>
          </View>
          <View style={green_line}></View>
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
              {Accounts.filter(
                (acc) => acc.type === "personal" && acc._id !== "personal"
              ).reduce((accumulator, acc) => accumulator + acc.balance, 0)}{" "}
              {user?.currency}
            </Text>
          </View>
          <View style={green_line}></View>
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
              {Accounts.filter(
                (acc) => acc.type === "expense" && acc._id !== "expense"
              ).reduce((accumulator, acc) => accumulator + acc.balance, 0)}{" "}
              {user?.currency}
            </Text>
          </View>
          <View style={green_line}></View>
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
