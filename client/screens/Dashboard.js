import React, { useContext, useState } from "react";
import { UsersContext } from "../context/UsersContext";
import { AntDesign } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import {
  container,
  accounts__block,
  accounts__header,
  body,
  green_line,
  accounts__add,
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
function Dashboard({navigation}) {
  const DATA = [
    
    {
      id: "bd7acbea-c1b1-46c2-aed5-3ad53abb28ba",
      title: "First Item",
    },
  ];

  const Item = ({ item, onPress}) => (
    <TouchableOpacity
      onPress={onPress}
      style={[accounts__add, { backgroundColor:colors.darkGray }]}
    >
      <AntDesign name="pluscircleo" size={24} color="white" />
    </TouchableOpacity>
  );


  const renderItem = ({ item }) => {
    
    return (
      <Item
        item={item}
        onPress={()=>navigation.navigate('Add new account',{type:"income"})}

      />
    );
  };
  return (
    <View style={[styles.container, { justifyContent: "start" }]}>
      <View style={accounts__block}>
        <View style={accounts__header}>
          <Text style={body}>Income</Text>
          <Text style={body}>0 USD</Text>
        </View>
        <View style={green_line}></View>
        <FlatList
          style={accounts__body}
          data={DATA}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={5}
        />
      </View>
    </View>
  );
}
const styles = {
  container,
};

export default Dashboard;
