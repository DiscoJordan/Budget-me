import React, { useContext, useEffect, useMemo, useRef, useCallback } from "react";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { formatNumber } from "../utils/formatNumber";
import { AntDesign } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
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
  colors,
  font,
  accounts__body,
} from "../styles/styles";
import { AccountsContext } from "../context/AccountsContext";
import { UsersContext } from "../context/UsersContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { toMainCurrency } from "../utils/convertCurrency";
import { Account } from "../src/types";
import DraggableAccountTile from "../components/DraggableAccountTile";
import { useDragOperation } from "../hooks/useDragOperation";

interface DashboardItem {
  _id: string;
  title?: string;
  type: string;
  name?: string;
  balance?: number;
  currency?: string;
  icon?: { color: string; icon_value: string };
  subcategories?: import("../src/types").Subcategory[];
}

const ICON_SIZE = 48;

function Dashboard({ navigation }: { navigation: any }) {
  const {
    getAccountsOfUser,
    accounts,
    setActiveAccount,
    setRecipientAccount,
    setType,
    setAccountData,
    randomColor,
  } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);
  const { rates, mainCurrency } = useContext(CurrencyContext);
  const containerRef = useRef<View>(null);
  const containerOffsetY = useSharedValue(0); // shared value so useAnimatedStyle can read it

  const measureContainer = useCallback(() => {
    containerRef.current?.measure((_x, _y, _w, _h, _px, pageY) => {
      containerOffsetY.value = pageY;
    });
  }, [containerOffsetY]);


  useEffect(() => {
    if (user) {
      getAccountsOfUser();
      setActiveAccount(null);
    }
  }, []);

  const {
    draggedAccount,
    hoveredTargetId,
    dragX,
    dragY,
    dragVisible,
    registerDropTarget,
    unregisterDropTarget,
    registerRemeasure,
    unregisterRemeasure,
    startDrag,
    updateDrag,
    endDrag,
  } = useDragOperation({
    setActiveAccount,
    setRecipientAccount,
    navigate: (screen) => navigation.navigate(screen),
  });

  const Accounts = useMemo<DashboardItem[]>(
    () => [
      ...(accounts.filter((a) => !a.archived) as DashboardItem[]),
      { _id: "income", title: "New account", type: "income" },
      { _id: "personal", title: "New account", type: "personal" },
      { _id: "expense", title: "New account", type: "expense" },
    ],
    [accounts]
  );

  const handleCurrentAccount = (accountId: string, itemType: string) => {
    setActiveAccount(accounts.find((acc) => acc._id === accountId) || null);
    navigation.navigate("Account", { type: itemType });
  };

  const floatingIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - ICON_SIZE / 2 },
      { translateY: dragY.value - containerOffsetY.value - ICON_SIZE / 2 },
    ],
  }));

  const isDraggableItem = (item: DashboardItem): boolean =>
    item.title !== "New account" &&
    (item.type === "income" || item.type === "personal");

  const renderItem = ({ item }: { item: DashboardItem }) => {
    if (item.title === "New account") {
      return (
        <TouchableOpacity
          onPress={() => {
            setActiveAccount(null);
            setAccountData({
              name: "",
              subcategories: [],
              ownerId: user?.id,
              type: item.type,
              icon: { color: randomColor, icon_value: "credit-card-outline" },
            });
            setType(item.type);
            navigation.navigate("Add new account");
          }}
          style={[accounts__add, { backgroundColor: colors.darkGray }]}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>
      );
    }

    const tileChildren = (
      <View style={account}>
        <View style={[accounts__add, { backgroundColor: item.icon?.color || "gray" }]}>
          <MaterialCommunityIcons
            name={(item.icon?.icon_value || "wallet-outline") as any}
            size={24}
            color="white"
          />
        </View>
        <Text
          numberOfLines={1}
          style={{ ...caption1, color: colors.gray, fontWeight: font.bold }}
        >
          {item.name}
        </Text>
        <Text style={{ ...caption1, color: "white", fontWeight: font.bold }}>
          {formatNumber(item.balance ?? 0)} {item.currency}
        </Text>
      </View>
    );

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (!draggedAccount) {
            handleCurrentAccount(item._id, item.type);
            setType("edit");
          }
        }}
      >
        <DraggableAccountTile
          account={item as Account}
          onDragStart={(account, x, y) => { measureContainer(); startDrag(account, x, y); }}
          onDragMove={updateDrag}
          onDragEnd={endDrag}
          onRegister={registerDropTarget}
          onUnregister={unregisterDropTarget}
          onRegisterRemeasure={registerRemeasure}
          onUnregisterRemeasure={unregisterRemeasure}
          isHovered={hoveredTargetId === item._id}
          isDraggable={isDraggableItem(item)}
          dragX={dragX}
          dragY={dragY}
          dragVisible={dragVisible}
        >
          {tileChildren}
        </DraggableAccountTile>
      </TouchableOpacity>
    );
  };

  return (
    <View
      ref={containerRef}
      style={{ flex: 1, overflow: "visible" }}
      onLayout={measureContainer}
    >
      <ScrollView
        style={{ backgroundColor: colors.background, padding: 20 }}
        scrollEnabled={!draggedAccount}
      >
        <View style={[styles.container, { justifyContent: "flex-start", minHeight: "100%" }]}>
          <View style={accounts__block}>
            <View style={accounts__header}>
              <Text style={body}>Income</Text>
              <Text style={body}>
                {formatNumber(
                  Accounts.filter((acc) => acc.type === "income" && acc._id !== "income")
                    .reduce((sum, acc) => sum + toMainCurrency(acc.balance ?? 0, acc.currency ?? "USD", rates, mainCurrency), 0)
                )}{" "}{mainCurrency}
              </Text>
            </View>
            <View style={green_line} />
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
                {formatNumber(
                  Accounts.filter((acc) => acc.type === "personal" && acc._id !== "personal")
                    .reduce((sum, acc) => sum + toMainCurrency(acc.balance ?? 0, acc.currency ?? "USD", rates, mainCurrency), 0)
                )}{" "}{mainCurrency}
              </Text>
            </View>
            <View style={green_line} />
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
                {formatNumber(
                  Accounts.filter((acc) => acc.type === "expense" && acc._id !== "expense")
                    .reduce((sum, acc) => sum + toMainCurrency(acc.balance ?? 0, acc.currency ?? "USD", rates, mainCurrency), 0)
                )}{" "}{mainCurrency}
              </Text>
            </View>
            <View style={green_line} />
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

      {/* Always mounted — avoids useAnimatedStyle losing native connection on remount */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingIconOuter,
          floatingIconStyle,
          { opacity: draggedAccount ? 1 : 0 },
        ]}
      >
        <View style={[styles.floatingIconInner, { backgroundColor: draggedAccount?.icon?.color || "gray" }]}>
          <MaterialCommunityIcons
            name={(draggedAccount?.icon?.icon_value || "wallet-outline") as any}
            size={28}
            color="white"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container,
  floatingIconOuter: {
    position: "absolute",
    left: 0,
    top: 0,
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  floatingIconInner: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
});

export default Dashboard;
