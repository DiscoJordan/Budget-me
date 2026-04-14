import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  TouchableOpacity,
} from "react-native";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
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
import Debts from "../screens/Debts";
import NewAccount from "../screens/NewAccount";
import { createStackNavigator } from "@react-navigation/stack";
import { Header } from "@react-navigation/elements";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";
import { TransactionsContext } from "../context/TransactionsContext";
import Account from "../screens/Account";
import EditDebts from "../screens/EditDebts";
import NewOperation from "../screens/NewOperation";
import Login from "../screens/Login";
import EditIcon from "../screens/EditIcon";
import EditTransaction from "../screens/EditTransaction";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import {
  GlassView,
  GlassContainer,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../styles/styles";
import { AccountingPeriodProvider } from "../context/AccountingPeriodContext";
import PeriodHeader from "./PeriodHeader";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const BUBBLE_SIZE = 52;
const TAB_ICONS: Record<string, string> = {
  Dashboard: "view-dashboard",
  History: "history",
  Report: "chart-donut",
  Settings: "cog",
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const translateX = useSharedValue(0);
  const tabWidth = useSharedValue(0);

  const onBarLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    tabWidth.value = w / state.routes.length;
    translateX.value = (w / state.routes.length) * state.index;
  };

  React.useEffect(() => {
    if (tabWidth.value > 0) {
      translateX.value = withTiming(tabWidth.value * state.index, {
        duration: 300,
      });
    }
  }, [state.index]);

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + (tabWidth.value - BUBBLE_SIZE) / 2 },
    ],
  }));

  const useLiquidGlass = isLiquidGlassAvailable();

  const barBackground = useLiquidGlass ? (
    <GlassContainer style={StyleSheet.absoluteFillObject}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        style={StyleSheet.absoluteFillObject}
      />
    </GlassContainer>
  ) : (
    <BlurView
      intensity={60}
      tint="dark"
      style={StyleSheet.absoluteFillObject}
    />
  );

  return (
    <View style={tabStyles.bar} onLayout={onBarLayout}>
      {barBackground}

      {/* Sliding glass bubble */}
      <Animated.View style={[tabStyles.bubbleTrack, bubbleAnimStyle]}>
        {useLiquidGlass ? (
          <GlassView
            glassEffectStyle="clear"
            colorScheme="dark"
            style={tabStyles.bubbleGlass}
          />
        ) : (
          <View style={tabStyles.bubbleFallback} />
        )}
      </Animated.View>

      {/* Tab buttons */}
      <View style={tabStyles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? colors.primaryGreen : colors.gray;
          const iconName = TAB_ICONS[route.name] || "help-circle";
          const label = options.tabBarLabel ?? route.name;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              style={tabStyles.tab}
            >
              <MaterialCommunityIcons
                name={iconName as any}
                size={24}
                color={color}
              />
              <Text style={[tabStyles.tabLabel, { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MyTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Dashboard"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
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
          tabBarLabel: t("tabs.dashboard"),
          headerTitle: () => <PeriodHeader />,
        }}
      />
      <Tab.Screen
        name="History"
        component={History}
        options={{
          tabBarLabel: t("tabs.history"),
          headerTitle: t("tabs.history"),
        }}
      />
      <Tab.Screen
        name="Report"
        component={Report}
        options={{
          tabBarLabel: t("tabs.report"),
          headerTitle: t("tabs.report"),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarLabel: t("tabs.settings"),
          headerTitle: t("tabs.settings"),
        }}
      />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    overflow: "hidden",
    backgroundColor: "rgba(4,8,15,0.85)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  tabRow: {
    flexDirection: "row",
    flex: 1,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  bubbleTrack: {
    position: "absolute",
    top: 8,
    left: 0,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    overflow: "hidden",
  },
  bubbleGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BUBBLE_SIZE / 2,
  },
  bubbleFallback: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});

const RegisteredOrNot = ({ navigation }: { navigation?: any }) => {
  const { t } = useTranslation();
  const { user } = useContext(UsersContext);
  const { activeAccount, getAccountsOfUser } = useContext(AccountsContext);
  const { transactions, getTransactionsOfUser } =
    useContext(TransactionsContext);

  const deleteAccount = async (navigation: any) => {
    try {
      // ─── OFFLINE-FIRST: replaced API call with SQLite ─────────────────────
      // const response = await axios.post(`${URL}/accounts/deleteaccount/`, { accountId: activeAccount?._id });
      if (!activeAccount?._id) return;
      const { deleteAccount: dbDeleteAccount, getAllAccounts } = await import("../db/accountsDb");
      const { deleteTransactionById, getTransactionsByAccount } = await import("../db/transactionsDb");

      const accountsInScope: string[] = [activeAccount._id];

      // If multi-account, collect sub-account IDs too
      if (activeAccount.isMultiAccount && user?.id) {
        const allAccounts = await getAllAccounts(user.id);
        const subs = allAccounts.filter((a) => a.parentId === activeAccount._id);
        subs.forEach((s) => accountsInScope.push(s._id));
      }

      // For each account in scope: delete its transactions, then delete the account
      for (const accId of accountsInScope) {
        const txs = await getTransactionsByAccount(accId);
        for (const tx of txs) await deleteTransactionById(tx._id);
        await dbDeleteAccount(accId);
      }

      await Promise.all([getTransactionsOfUser(), getAccountsOfUser()]);
      navigation.navigate("Home", { screen: "Dashboard" });
    } catch (error) {
      console.log(error);
    }
  };

  const createAlert = (navigation: any) => {
    const count = transactions.filter(
      (tran) =>
        (tran?.senderId as any)?._id === activeAccount?._id ||
        (tran?.recipientId as any)?._id === activeAccount?._id,
    ).length;
    Alert.alert(t("nav.deleteAccount"), t("nav.deleteAccountMsg", { count }), [
      { text: t("common.cancel"), onPress: () => {} },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteAccount(navigation),
      },
    ]);
  };

  return (
    <AccountingPeriodProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator
            id={undefined}
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
            {/* OFFLINE-FIRST: always show authenticated routes; auth gate commented out */}
            {true /* user */ ? (
              <>
                <Stack.Screen
                  name="Home"
                  component={MyTabs}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Add new account"
                  component={NewAccount}
                  options={({ navigation }: { navigation: any }) => ({
                    title: activeAccount?.name
                      ? t("newAccount.editAccount", {
                          name: activeAccount.name,
                        })
                      : t("newAccount.newAccount"),
                    headerRight: activeAccount?.name
                      ? () => (
                          <TouchableOpacity
                            onPress={() => createAlert(navigation)}
                          >
                            <MaterialCommunityIcons
                              style={{ paddingRight: 20 }}
                              name="delete-sweep-outline"
                              size={24}
                              color="white"
                            />
                          </TouchableOpacity>
                        )
                      : undefined,
                  })}
                />
                <Stack.Screen
                  options={({ navigation }: { navigation: any }) => ({
                    title: activeAccount?.name,
                    headerRight: () => (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("Add new account", {
                            type: "edit",
                          })
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
                <Stack.Screen
                  name="Settings"
                  component={Settings}
                  options={{ title: t("tabs.settings") }}
                />
                <Stack.Screen
                  name="Debts"
                  component={Debts}
                  options={{ title: t("nav.debtsScreen") }}
                />
                <Stack.Screen
                  name="Edit Debts"
                  component={EditDebts}
                  options={{ title: t("nav.editDebts") }}
                />
                <Stack.Group
                  screenOptions={{
                    presentation: "transparentModal",
                    headerShown: false,
                    cardStyle: { backgroundColor: "transparent" },
                  }}
                >
                  <Stack.Screen
                    name="New operation"
                    component={NewOperation}
                    options={{
                      headerShown: false,
                      cardStyle: { backgroundColor: "transparent" },
                    }}
                  />
                  <Stack.Screen
                    name="Edit transaction"
                    component={EditTransaction}
                    options={{ title: t("nav.editTransaction") }}
                  />
                  <Stack.Screen
                    name="Choose icon"
                    component={EditIcon}
                    options={{ title: t("nav.chooseIcon") }}
                  />
                </Stack.Group>
              </>
            ) : /* OFFLINE-FIRST: login/registration commented out */ null
            // ) : (
            //   <>
            //     <Stack.Screen options={{ headerShown: false }} name="Registration" component={Registration} />
            //     <Stack.Screen options={{ headerShown: false }} name="Login" component={Login} />
            //   </>
            // )
            }
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </AccountingPeriodProvider>
  );
};

export default RegisteredOrNot;

const styles = StyleSheet.create({});
