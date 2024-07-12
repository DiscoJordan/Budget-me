import React, { useContext } from "react";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Registration from "./screens/Registration";
import History from "./screens/History";
import Dashboard from "./screens/Dashboard";
import Report from "./screens/Report";
import Settings from "./screens/Settings";
import { UsersProvider } from "./context/UsersContext";
import { createStackNavigator } from "@react-navigation/stack";
import { Header } from "@react-navigation/elements";
import { UsersContext } from "./context/UsersContext";
import RegisteredOrNot from "./components/RegisteredOrNot";

import {
  container,
  h1,
  input,
  blue,
  submit_button,
  submit_button_text,
  colors,
  font,
  sizes,
} from "./styles/styles";

const App = () => {


  return (
    <UsersProvider> 
        <SafeAreaView></SafeAreaView>
        <RegisteredOrNot />
    </UsersProvider>
  );
};
const styles = StyleSheet.create({
  container,
  h1,
  input,
  blue,
  submit_button,
  submit_button_text,
  colors,
  font,
  sizes,
});
export default App;
