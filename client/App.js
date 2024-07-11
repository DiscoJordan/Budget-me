import * as React from "react";
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
import { createStackNavigator } from '@react-navigation/stack';
import { Header } from '@react-navigation/elements';
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



const Tab = createBottomTabNavigator();

   
function MyTabs() {
  return (
    
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: colors.primaryGreen,
        tabBarInactiveTintColor: colors.gray, 
        tabBarStyle: { backgroundColor: colors.darkBlack }, 
       
        
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Registration}
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

const App = () => {
  // const [index, setIndex] = React.useState(0);
  // const [routes] = React.useState([
  //   {
  //     key: "dashboard",
  //     title: "Dashboard",
  //     focusedIcon: "view-dashboard",
  //   },
  //   { key: "history", title: "History", focusedIcon: "history" },
  //   { key: "report", title: "Report", focusedIcon: "chart-donut" },
  //   {
  //     key: "settings",
  //     title: "Settings",
  //     focusedIcon: "cog",
  //     unfocusedIcon: "cog-outline",
  //   },
  // ]);

  // const renderScene = BottomNavigation.SceneMap({
  //   dashboard: Registration,
  //   history: History,
  //   report: Report,
  //   settings: Settings,
  // });

  return (
    <UsersProvider>
        <SafeAreaView></SafeAreaView>
        {/* <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
          shifting={true}
          activeColor={"#009F9C"}
          inactiveColor={"#919191"}
          barStyle={{ backgroundColor: "#0F0F0F" }}
          theme={{ colors: { secondaryContainer: "#0F0F0F" } }}
        /> */}
        <NavigationContainer>

          <MyTabs />
        </NavigationContainer>
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
