import React, {useContext} from "react";
import { UsersContext } from "../context/UsersContext";
import { Feather } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  container,
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
} from "../styles/styles";
function Settings() {
  const {logout} = useContext(UsersContext);
  return (
    <View style={container}>
      <TouchableOpacity onPress={logout} style={setting_option}>
        <Text style={subheadline}>Log out</Text>
        <Feather name="log-out" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

export default Settings;
