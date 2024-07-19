import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  TouchableOpacity,
} from "react-native";
import React, { useContext, useEffect } from "react";
import axios from "axios";
import { URL } from "../config";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Registration from "../screens/Registration";
import History from "../screens/History";
import Dashboard from "../screens/Dashboard";
import Report from "../screens/Report";
import Settings from "../screens/Settings";
import NewAccount from "../screens/NewAccount";
import { createStackNavigator } from "@react-navigation/stack";
import { Header } from "@react-navigation/elements";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";
import { TransactionsContext } from "../context/TransactionsContext";
import Account from "../screens/Account";
import NewOperation from "../screens/NewOperation";
import Login from "../screens/Login";
import EditIcon from "../screens/EditIcon";

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
} from "../styles/styles";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
function MyTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: colors.primaryGreen,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.darkBlack,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: colors.darkBlack,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={History}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={Report}
        options={{
          tabBarLabel: "Report",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-donut"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
const RegisteredOrNot = ({ navigation }) => {
  const { user } = useContext(UsersContext);
  const { activeAccount, getAccountsOfUser } = useContext(AccountsContext);
  const { transactions,getTransactionsOfUser } = useContext(TransactionsContext);

  const deleteAccount = async (navigation) => {
    try {
      const response = await axios.post(`${URL}/accounts/deleteaccount/`, {
        accountId:activeAccount._id
      });
      if (response.data.ok) {
        getTransactionsOfUser();
        getAccountsOfUser();
        
        navigation.navigate("Dashboard");
      } else{
        console.log(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const createAlert = (navigation) =>
    Alert.alert(
      "Delete Account?",
      `Are you sure that you want to delete an account with ${
        transactions.filter(
          (tran) =>
            tran?.senderId?._id === activeAccount._id ||
            tran?.recipientId?._id === activeAccount._id
        ).length
      } transactions?`,
      [
        { text: "Cancel", style: "destructive", onPress: () => {} },
        {
          text: "Delete",
          onPress: () => deleteAccount(navigation),
        },
      ]
    );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.darkBlack,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={MyTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Add new account"
              component={NewAccount}
              options={({ navigation }) => ({
                title: activeAccount?.name
                  ? "Edit " + activeAccount.name
                  : "New Account",
                headerRight: () => (
                  <TouchableOpacity onPress={() => createAlert(navigation)}>
                    <MaterialCommunityIcons
                      style={{ paddingRight: 20 }}
                      name="delete-sweep-outline"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              options={({ navigation }) => ({
                title: activeAccount.name,
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("Add new account", { type: "edit" })
                    }
                  >
                    <MaterialCommunityIcons
                      style={{ paddingRight: 20 }}
                      name="pencil-outline"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                ),
              })}
              name="Account"
              component={Account}
            />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Group screenOptions={{ presentation: "modal" }}>
              <Stack.Screen name="New operation" component={NewOperation} />
              <Stack.Screen name="Choose icon" component={EditIcon} />
            </Stack.Group>
          </>
        ) : (
          <>
            <Stack.Screen
              options={{ headerShown: false }}
              name="Registration"
              component={Registration}
            />
            <Stack.Screen
              options={{ headerShown: false }}
              name="Login"
              component={Login}
            />
          </>
        )}
      </Stack.Navigator>
      {/* )} */}
    </NavigationContainer>
  );
};

export default RegisteredOrNot;

const styles = StyleSheet.create({});
