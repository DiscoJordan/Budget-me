import { StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect } from "react";
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
import Login from "../screens/Login";


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
const RegisteredOrNot = () => {
 
  const { user, login, getUserData, verify_token } =
  useContext(UsersContext);


  console.log("user", user);
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
      }}>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={MyTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Add new account" component={NewAccount} />
            <Stack.Screen name="Settings" component={Settings} />
          </>
        ) : (
            <>
            <Stack.Screen options={{ headerShown: false }} name="Registration" component={Registration} />
            <Stack.Screen options={{ headerShown: false }} name="Login" component={Login} />
            </>
        )}
      </Stack.Navigator>
      {/* )} */}
    </NavigationContainer>
  );
};

export default RegisteredOrNot;

const styles = StyleSheet.create({});
