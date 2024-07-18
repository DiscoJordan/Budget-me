import React, { useState, useContext, useEffect } from "react";
import uuid from "react-native-uuid";
import Dialog from "react-native-dialog";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
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
  accounts__body,
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

function EditIcon({ navigation }) {
  const {
    getAccountsOfUser,
    activeAccount,
    iconColors,
    randomColor,
    setAccountData,
    accountData,
    iconValues,
  } = useContext(AccountsContext);
  const [chosen, setChosen] = useState(
    activeAccount?.icon?.color || accountData.icon.color
  );
  const [chosenIcon, setChosenIcon] = useState(
    activeAccount?.icon?.icon_value || accountData?.icon?.icon_value
  );

  useEffect(() => {
    console.log("accountData in icon", accountData);
  }, [accountData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setAccountData({
      ...accountData,
      icon: { icon_value: chosenIcon, color: chosen },
    });
    navigation.navigate("Add new account");
  };

  useEffect(() => {
    console.log(accountData);
  }, [accountData]);

  const colorItem = (color) => {
    return (
      <TouchableOpacity
        onPress={() => setChosen(color)}
        style={
          chosen !== color
            ? { ...styles.colorItem, backgroundColor: color }
            : {
                ...styles.colorItem,
                backgroundColor: color,
                borderWidth: 5,
                borderColor: "white",
              }
        }
      ></TouchableOpacity>
    );
  };

  const Item = ({ item, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={
        chosenIcon !== item
          ? [accounts__add, { backgroundColor: colors.darkGray }]
          : [accounts__add, { backgroundColor: chosen }]
      }
    >
      <MaterialCommunityIcons name={item} size={24} color="white" />
    </TouchableOpacity>
  );
  const renderItem = ({ item }) => {
    return <Item item={item} onPress={() => setChosenIcon(item)} />;
  };
  return (
    <View
      style={{
        flex: 1,
        position: "relative",
        backgroundColor: colors.background,
        alignItems: "center",
      }}
    >
      <ScrollView style={{ width: "100%", }}>
        <View style={{ ...container, margin:20, minHeight: "100%",}}>
          {/* <Text style={styles.h1}>Title</Text> */}
          <View style={{...accounts__body, alignItems:'center',gap:20, marginBottom:100}}>
            <TouchableOpacity
              style={[
                { ...accounts__add, height: 80 },
                {
                  backgroundColor: chosen,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={chosenIcon}
                size={42}
                color="white"
              />
            </TouchableOpacity>
            <View style={styles.colorPeeker}>
              {iconColors.map((color) => colorItem(color))}
            </View>
            <FlatList
              scrollEnabled={false}
              style={accounts__body}
              data={iconValues}
              renderItem={renderItem}
              keyExtractor={(item) => item}
              numColumns={5}
            />
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity style={submit_button} onPress={handleSubmit}>
        <Text style={styles.submit_button_text}>Save</Text>
      </TouchableOpacity>
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
  iconPeeker: {
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
  font,
});
export default EditIcon;
