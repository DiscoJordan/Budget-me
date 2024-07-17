import React, { useState, useContext, useEffect } from "react";
import uuid from "react-native-uuid";
import Dialog from "react-native-dialog";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Button,
  Alert,
} from "react-native";
import {
  container,
  h1,
  input,
  blue,
  submit_button,
  submit_button_text,
  colors,
  font,
  caption1,
  subheadline,
  caption2,
  body,
  size,
  account,
  accounts__add,
} from "../styles/styles";
import { URL } from "../config";
import axios from "axios";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { wrap } from "framer-motion";

function EditIcon({ navigation, route }) {
  const { setAccountData, accountData } = route.params;
  const { login, user } = useContext(UsersContext);
  const { getAccountsOfUser, activeAccount, iconColors, randomColor } =
    useContext(AccountsContext);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //   axios.defaults.headers.common["Authorization"] = token;
      const response = await axios.post(
        `${URL}/accounts/addaccount`,
        accountData
      );
      setMessage(response.data.data);
      setTimeout(() => {
        setMessage("");
      }, 2000);
      //   getPlaces();
      if (response.data.ok) {
        getAccountsOfUser();
        navigation.navigate("Dashboard");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const colorItem = (color) => {
    return (
      <View
        onPress={()=>setAccountData(prev=>({
          ...prev,
          icon: { ...prev.icon, color: color },
        }))}
        style={{ ...styles.colorItem, backgroundColor: color }}
      ></View>
    );
  };

  return (
    <View style={{ flex: 1, position: "relative", alignItems: "center" }}>
      <View style={{ ...container, minHeight: "100%" }}>
        {/* <Text style={styles.h1}>Title</Text> */}
        <View style={account}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Choose icon")}
            style={[
              { ...accounts__add, height: 80 },
              {
                backgroundColor: activeAccount.icon
                  ? activeAccount.icon.color
                  : accountData.icon.color,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                activeAccount.icon
                  ? activeAccount.icon.icon_value
                  : "credit-card-outline"
              }
              size={42}
              color="white"
            />
          </TouchableOpacity>
          <View style={styles.colorPeeker}>
            {iconColors.map((color) => colorItem(color))}
          </View>
        </View>

        <TouchableOpacity style={submit_button} onPress={handleSubmit}>
          <Text style={styles.submit_button_text}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  green: {
    color: colors.primaryGreen,
  },
  colorPeeker: {
    width: "90%",
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  colorItem: {
    borderWidth: 10,
    borderColor: colors.darkgray,
    borderRadius: 20,
    width: 40,
    height: 40,
  },
  h1,
  input,
  blue,
  submit_button,
  submit_button_text,
  colors,
  font,
});
export default EditIcon;
