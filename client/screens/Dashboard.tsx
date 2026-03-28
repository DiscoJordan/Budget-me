import React, { useContext, useMemo, useRef, useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
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
import { TransactionsContext } from "../context/TransactionsContext";
import { AccountingPeriodContext } from "../context/AccountingPeriodContext";
import { DebtsContext } from "../context/DebtsContext";
import { toMainCurrency } from "../utils/convertCurrency";
import { Account } from "../src/types";
import { getCurrencyMeta } from "../utils/currencyInfo";
import DraggableAccountTile from "../components/DraggableAccountTile";
import { useDragOperation } from "../hooks/useDragOperation";
import { getAllBudgetsFromAccounts } from "../utils/budgetStorage";

interface DashboardItem {
  _id: string;
  title?: string;
  type: string;
  name?: string;
  balance?: number;
  currency?: string;
  icon?: { color: string; icon_value: string };
  subcategories?: import("../src/types").Subcategory[];
  isMultiAccount?: boolean;
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
  const { settings: debtSettings } = useContext(DebtsContext);
  const { transactions, getTransactionsOfUser } =
    useContext(TransactionsContext);
  const { dateFrom, dateTo, periodType } = useContext(AccountingPeriodContext);
  const containerRef = useRef<View>(null);
  const containerOffsetY = useSharedValue(0); // shared value so useAnimatedStyle can read it

  const allBudgets = useMemo(() => getAllBudgetsFromAccounts(accounts), [accounts]);

  const { incomeBudgetTotal, expenseBudgetTotal } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const acc of accounts) {
      const b = acc.budgets?.[periodType] ?? 0;
      if (b > 0) {
        const converted = toMainCurrency(b, acc.currency ?? "USD", rates, mainCurrency);
        if (acc.type === "income") inc += converted;
        else if (acc.type === "expense") exp += converted;
      }
    }
    return { incomeBudgetTotal: inc, expenseBudgetTotal: exp };
  }, [accounts, periodType, rates, mainCurrency]);

  const measureContainer = useCallback(() => {
    containerRef.current?.measure((_x, _y, _w, _h, _px, pageY) => {
      containerOffsetY.value = pageY;
    });
  }, [containerOffsetY]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        getAccountsOfUser();
        getTransactionsOfUser();
        setActiveAccount(null);
      }
    }, [user]),
  );

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
    navigate: (screen, params) => navigation.navigate(screen, params),
  });

  // Map parentId → sub-accounts for multi-account balance aggregation
  const subAccountsByParent = useMemo(() => {
    const map = new Map<string, (typeof accounts)[number][]>();
    for (const acc of accounts) {
      if (acc.parentId) {
        if (!map.has(acc.parentId)) map.set(acc.parentId, []);
        map.get(acc.parentId)!.push(acc);
      }
    }
    return map;
  }, [accounts]);

  const debtAccounts = useMemo(
    () => accounts.filter((a) => a.type === "debt" && !a.archived),
    [accounts],
  );

  const debtTotalBalance = useMemo(
    () =>
      debtAccounts.reduce(
        (sum, a) =>
          sum +
          toMainCurrency(
            a.balance ?? 0,
            a.currency ?? mainCurrency,
            rates,
            mainCurrency,
          ),
        0,
      ),
    [debtAccounts, rates, mainCurrency],
  );

  const DEBTS_TILE = useMemo<DashboardItem>(
    () => ({
      _id: "__debts__",
      type: "debt",
      name: "Debts",
      balance: debtTotalBalance,
      currency: mainCurrency,
      icon: { color: colors.primaryGreen, icon_value: "handshake-outline" },
    }),
    [debtTotalBalance, mainCurrency],
  );

  const Accounts = useMemo<DashboardItem[]>(
    () => [
      // exclude sub-accounts (they appear under their parent tile)
      ...(accounts.filter(
        (a) => !a.archived && !a.parentId && a.type !== "debt",
      ) as DashboardItem[]),
      { _id: "income", title: "New account", type: "income" },
      { _id: "personal", title: "New account", type: "personal" },
      { _id: "expense", title: "New account", type: "expense" },
    ],
    [accounts],
  );

  const { periodAmounts, periodTotals } = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const time = new Date(t.time).getTime();
      if (dateFrom && time < dateFrom.getTime()) return false;
      if (dateTo && time > dateTo.getTime()) return false;
      return true;
    });

    // per-account period amount in each account's own currency
    const amountMap = new Map<string, number>();
    const accCurrencyMap = new Map<string, string>();
    for (const acc of accounts) {
      amountMap.set(acc._id, 0);
      accCurrencyMap.set(acc._id, acc.currency ?? "USD");
    }

    const convertTo = (amount: number, from: string, to: string) => {
      if (from === to) return amount;
      const r = rates as Record<string, number>;
      if (!r[from] || !r[to]) return amount;
      return (amount / r[from]) * r[to];
    };

    let incomeTotal = 0;
    let expenseTotal = 0;

    for (const t of filtered) {
      const senderId = (t.senderId as any)?._id as string | undefined;
      const recipientId = (t.recipientId as any)?._id as string | undefined;
      const senderType = (t.senderId as any)?.type as string | undefined;
      const recipientType = (t.recipientId as any)?.type as string | undefined;
      const tCurrency = t.currency ?? "USD";

      if (senderId && amountMap.has(senderId)) {
        const tgt = accCurrencyMap.get(senderId) ?? "USD";
        const converted = convertTo(t.amount, tCurrency, tgt);
        // income accounts: positive = money they generated (sent out)
        // personal accounts: subtract what they sent
        amountMap.set(
          senderId,
          (amountMap.get(senderId) ?? 0) +
            (senderType === "income" ? converted : -converted),
        );
      }
      if (recipientId && amountMap.has(recipientId)) {
        const tgt = accCurrencyMap.get(recipientId) ?? "USD";
        amountMap.set(
          recipientId,
          (amountMap.get(recipientId) ?? 0) +
            convertTo(t.amount, tCurrency, tgt),
        );
      }

      const converted = toMainCurrency(
        t.amount,
        tCurrency,
        rates,
        mainCurrency,
      );
      if (senderType === "income" && recipientType === "personal")
        incomeTotal += converted;
      else if (senderType === "personal" && recipientType === "expense")
        expenseTotal += converted;
    }

    // Calculate total personal accounts balance (not affected by period filter)
    const personalTotal =
      Math.round(
        accounts
          .filter(
            (acc) =>
              !acc.archived &&
              (acc.type === "personal" ||
                (acc.type === "debt" && debtSettings.includeInPersonalBalance)),
          )
          .reduce(
            (sum, acc) =>
              sum +
              toMainCurrency(acc.balance, acc.currency, rates, mainCurrency),
            0,
          ) * 100,
      ) / 100;

    // Aggregate sub-account period amounts under their parent (in main currency)
    for (const [parentId, subs] of subAccountsByParent.entries()) {
      let parentPeriodTotal = 0;
      for (const sub of subs) {
        const subAmt = amountMap.get(sub._id) ?? 0;
        parentPeriodTotal += toMainCurrency(
          subAmt,
          sub.currency ?? "USD",
          rates,
          mainCurrency,
        );
      }
      amountMap.set(parentId, parentPeriodTotal);
    }

    return {
      periodAmounts: amountMap,
      periodTotals: { incomeTotal, expenseTotal, personalNet: personalTotal },
    };
  }, [
    transactions,
    accounts,
    subAccountsByParent,
    dateFrom,
    dateTo,
    rates,
    mainCurrency,
    debtSettings.includeInPersonalBalance,
  ]);

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
    (item.type === "income" ||
      item.type === "personal" ||
      item.type === "debt");

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

    const accountBudget =
      item.type === "income" || item.type === "expense"
        ? (allBudgets[(item as Account)._id]?.[periodType] ?? 0)
        : 0;
    const periodAmt = periodAmounts.get(item._id) ?? 0;
    const budgetColor =
      accountBudget > 0
        ? item.type === "income" && periodAmt >= accountBudget
          ? colors.green
          : item.type === "expense" && periodAmt >= accountBudget
            ? colors.red
            : "white"
        : "white";

    const tileChildren = (
      <View style={account}>
        <View
          style={[
            accounts__add,
            { backgroundColor: item.icon?.color || "gray" },
          ]}
        >
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
        <Text style={{ ...caption1, color: budgetColor, fontWeight: font.bold }}>
          {formatNumber(
            item._id === "__debts__"
              ? (item.balance ?? 0)
              : item.isMultiAccount
                ? (subAccountsByParent.get(item._id) ?? []).reduce(
                    (sum, sub) =>
                      sum +
                      toMainCurrency(
                        sub.balance ?? 0,
                        sub.currency ?? "USD",
                        rates,
                        mainCurrency,
                      ),
                    0,
                  )
                : item.type === "personal"
                  ? (item as Account).balance
                  : periodAmt,
          )}{" "}
          {item.isMultiAccount
            ? mainCurrency
            : getCurrencyMeta(item.currency).symbol}
        </Text>
        {(item.type === "income" || item.type === "expense") &&
          accountBudget > 0 && (
            <Text style={{ ...caption1, color: colors.gray }}>
              / {formatNumber(accountBudget)}{" "}
              {getCurrencyMeta(
                item.isMultiAccount ? mainCurrency : item.currency,
              ).symbol}
            </Text>
          )}
      </View>
    );

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (!draggedAccount) {
            if (item._id === "__debts__") {
              navigation.navigate("Debts");
            } else {
              handleCurrentAccount(item._id, item.type);
              setType("edit");
            }
          }
        }}
      >
        <DraggableAccountTile
          account={item as Account}
          onDragStart={(account, x, y) => {
            measureContainer();
            startDrag(account, x, y);
          }}
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
        <View
          style={[
            styles.container,
            { justifyContent: "flex-start", minHeight: "100%" },
          ]}
        >
          <View style={accounts__block}>
            <View style={accounts__header}>
              <Text style={body}>Income</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={body}>
                  {formatNumber(periodTotals.incomeTotal)}{" "}
                  {getCurrencyMeta(mainCurrency).symbol}
                </Text>
                {incomeBudgetTotal > 0 && (
                  <Text style={{ ...caption1, color: colors.gray }}>
                    / {formatNumber(incomeBudgetTotal)}{" "}
                    {getCurrencyMeta(mainCurrency).symbol}
                  </Text>
                )}
              </View>
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
                {formatNumber(periodTotals.personalNet)}{" "}
                {getCurrencyMeta(mainCurrency).symbol}
              </Text>
            </View>
            <View style={green_line} />
            <FlatList
              scrollEnabled={false}
              style={accounts__body}
              data={[
                ...(debtSettings.enabled ? [DEBTS_TILE] : []),
                ...Accounts.filter((acc) => acc.type === "personal"),
              ]}
              renderItem={renderItem}
              keyExtractor={(item) => item._id}
              numColumns={5}
            />
          </View>
          <View style={accounts__block}>
            <View style={accounts__header}>
              <Text style={body}>Expenses</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={body}>
                  {formatNumber(periodTotals.expenseTotal)}{" "}
                  {getCurrencyMeta(mainCurrency).symbol}
                </Text>
                {expenseBudgetTotal > 0 && (
                  <Text style={{ ...caption1, color: colors.gray }}>
                    / {formatNumber(expenseBudgetTotal)}{" "}
                    {getCurrencyMeta(mainCurrency).symbol}
                  </Text>
                )}
              </View>
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
        <View
          style={[
            styles.floatingIconInner,
            { backgroundColor: draggedAccount?.icon?.color || "gray" },
          ]}
        >
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
