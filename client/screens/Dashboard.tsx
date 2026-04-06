import React, {
  useContext,
  useMemo,
  useRef,
  useCallback,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { formatNumber } from "../utils/formatNumber";
import { AntDesign } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import {
  container,
  accounts__block,
  caption1,
  colors,
  font,
  windowWidth,
} from "../styles/styles";
import { AccountsContext } from "../context/AccountsContext";
import { UsersContext } from "../context/UsersContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { TransactionsContext } from "../context/TransactionsContext";
import { AccountingPeriodContext } from "../context/AccountingPeriodContext";
import { DebtsContext } from "../context/DebtsContext";
import { AssetsContext } from "../context/AssetsContext";
import { toMainCurrency } from "../utils/convertCurrency";
import { Account } from "../src/types";
import { getCurrencyMeta } from "../utils/currencyInfo";
import DraggableAccountTile from "../components/DraggableAccountTile";
import { BlurView } from "expo-blur";
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
    loading: accountsLoading,
  } = useContext(AccountsContext);
  const { t } = useTranslation();
  const { user } = useContext(UsersContext);
  const { rates, mainCurrency } = useContext(CurrencyContext);
  const { settings: debtSettings } = useContext(DebtsContext);
  const { settings: assetSettings } = useContext(AssetsContext);
  const {
    transactions,
    getTransactionsOfUser,
    loading: transactionsLoading,
  } = useContext(TransactionsContext);
  const { dateFrom, dateTo, periodType } = useContext(AccountingPeriodContext);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [incPage, setIncPage] = useState(0);
  const [perPage, setPerPage] = useState(0);
  const [expPage, setExpPage] = useState(0);
  const toggleHidden = (type: string) =>
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  const containerRef = useRef<View>(null);
  const containerOffsetY = useSharedValue(0); // shared value so useAnimatedStyle can read it

  const allBudgets = useMemo(
    () => getAllBudgetsFromAccounts(accounts),
    [accounts],
  );

  const { incomeBudgetTotal, expenseBudgetTotal } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const acc of accounts) {
      const b = acc.budgets?.[periodType] ?? 0;
      if (b > 0) {
        const converted = toMainCurrency(
          b,
          acc.currency ?? "USD",
          rates,
          mainCurrency,
        );
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
      name: t("accountTypes.debt"),
      balance: debtTotalBalance,
      currency: mainCurrency,
      icon: { color: colors.primaryGreen, icon_value: "handshake-outline" },
    }),
    [debtTotalBalance, mainCurrency, t],
  );

  const assetAccounts = useMemo(
    () => accounts.filter((a) => a.type === "asset" && !a.archived),
    [accounts],
  );

  const assetTotalValue = useMemo(
    () =>
      assetAccounts.reduce(
        (sum, a) =>
          sum +
          toMainCurrency(
            a.initialBalance ?? 0,
            a.currency ?? mainCurrency,
            rates,
            mainCurrency,
          ),
        0,
      ),
    [assetAccounts, rates, mainCurrency],
  );

  const ASSETS_TILE = useMemo<DashboardItem>(
    () => ({
      _id: "__assets__",
      type: "asset",
      name: t("accountTypes.asset"),
      balance: assetTotalValue,
      currency: mainCurrency,
      icon: { color: "#F7DC6F", icon_value: "briefcase-outline" },
    }),
    [assetTotalValue, mainCurrency, t],
  );

  const Accounts = useMemo<DashboardItem[]>(
    () => [
      // exclude sub-accounts (they appear under their parent tile)
      ...(accounts.filter(
        (a) => !a.archived && !a.parentId && a.type !== "debt" && a.type !== "asset",
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
                (acc.type === "debt" && debtSettings.includeInPersonalBalance) ||
                (acc.type === "asset" && assetSettings.includeInPersonalBalance)),
          )
          .reduce(
            (sum, acc) =>
              sum +
              toMainCurrency(
                acc.type === "asset" ? (acc.initialBalance ?? 0) : acc.balance,
                acc.currency,
                rates,
                mainCurrency,
              ),
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
    assetSettings.includeInPersonalBalance,
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
    item.type === "income" || item.type === "personal" || item.type === "debt";

  const renderTile = (item: DashboardItem) => {
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

    const glassLevel =
      item.type === "income"
        ? {
            bg: "rgba(70,241,197,0.07)",
            border: "rgba(70,241,197,0.18)",
            glow: colors.primaryGreen,
          }
        : item.type === "expense"
          ? {
              bg: "rgba(255,178,190,0.07)",
              border: "rgba(255,178,190,0.18)",
              glow: colors.red,
            }
          : {
              bg: "rgba(255,255,255,0.04)",
              border: "rgba(255,255,255,0.10)",
              glow: "transparent" as const,
            };

    const iconColor = item.icon?.color || "gray";
    const isAssetTile = item._id === "__assets__";
    const rawAmount =
      item._id === "__debts__" || isAssetTile
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
            : periodAmt;
    const amountValue = (isAssetTile ? "~" : "") + formatNumber(rawAmount);
    const currencySymbol = item.isMultiAccount
      ? mainCurrency
      : getCurrencyMeta(item.currency).symbol;
    const isHidden = hiddenTypes.has(
      item.type === "debt" || item.type === "asset" ? "personal" : item.type,
    );

    const tileContent = (
      <BlurView
        intensity={28}
        tint="dark"
        style={[
          styles.glassTile,
          {
            shadowColor: glassLevel.glow,
            borderColor: glassLevel.border,
            borderWidth: 1,
            overflow: "hidden",
          },
        ]}
      >
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: glassLevel.bg }]}
        />
        <View
          style={[
            styles.tileIconWrap,
            { backgroundColor: iconColor + "55", shadowColor: iconColor },
          ]}
        >
          <MaterialCommunityIcons
            name={(item.icon?.icon_value || "wallet-outline") as any}
            size={18}
            color="white"
          />
        </View>
        <Text numberOfLines={1} style={styles.tileName}>
          {item.name}
        </Text>
        <View style={[styles.tileAmountRow, isHidden && styles.blur]}>
          <Text
            numberOfLines={1}
            style={[styles.tileAmount, { color: budgetColor }]}
          >
            {amountValue}
          </Text>
          <Text style={styles.tileCurrency}>{currencySymbol}</Text>
          {(item.type === "income" || item.type === "expense") &&
            accountBudget > 0 && (
              <Text style={styles.tileBudget}>
                /{formatNumber(accountBudget)}
              </Text>
            )}
        </View>
      </BlurView>
    );

    return (
      <TouchableOpacity
        key={item._id}
        activeOpacity={0.8}
        onPress={() => {
          if (!draggedAccount) {
            if (item._id === "__debts__") {
              navigation.navigate("Debts");
            } else if (item._id === "__assets__") {
              navigation.navigate("Assets");
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
          {tileContent}
        </DraggableAccountTile>
      </TouchableOpacity>
    );
  };

  const PAGE_W = windowWidth - 40;
  const TILES_PER_ROW = Math.floor(PAGE_W / (TILE_W + 6));

  const renderPagedGrid = (
    items: DashboardItem[],
    numRows: number,
    pageIdx: number,
    setPageIdx: (n: number) => void,
    addType: string,
    pinnedItems: DashboardItem[] = [],
  ) => {
    const slotsPerPage = TILES_PER_ROW * numRows - pinnedItems.length;
    const pages: DashboardItem[][] = [];
    for (let i = 0; i < items.length; i += slotsPerPage) {
      pages.push(items.slice(i, i + slotsPerPage));
    }
    if (pages.length === 0) pages.push([]);
    const totalPages = pages.length;
    return (
      <View>
        <View style={{ position: "relative" }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const p = Math.round(e.nativeEvent.contentOffset.x / PAGE_W);
              setPageIdx(p);
            }}
            style={{ width: PAGE_W }}
          >
            {pages.map((pageItems, pi) => (
              <View
                key={pi}
                style={{ width: PAGE_W, flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" }}
              >
                {[...pinnedItems, ...pageItems].map(renderTile)}
              </View>
            ))}
          </ScrollView>
          {renderAddButton(addType)}
        </View>
        {totalPages > 1 && (
          <View style={styles.dotsRow}>
            {Array.from({ length: totalPages }, (_, i) => (
              <View key={i} style={[styles.dot, i === pageIdx && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderAddButton = (type: string) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.addTileWrapper}
      onPress={() => {
        setActiveAccount(null);
        setAccountData({
          name: "",
          subcategories: [],
          ownerId: user?.id,
          type,
          icon: { color: randomColor, icon_value: "credit-card-outline" },
        });
        setType(type);
        navigation.navigate("Add new account");
      }}
    >
      <AntDesign name="plus" size={13} color={colors.gray} />
    </TouchableOpacity>
  );

  return (
    <View
      ref={containerRef}
      style={{ flex: 1, overflow: "visible" }}
      onLayout={measureContainer}
    >
      {(accountsLoading || transactionsLoading) && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
        </View>
      )}
      <View
        style={{
          backgroundColor: colors.background,
          padding: 20,
          flex: 1,
          justifyContent: "flex-start",
        }}
      >
        <View style={[styles.container, { justifyContent: "flex-start" }]}>
          {/* INCOME — 1 row horizontal scroll */}
          <BlurView
            intensity={20}
            tint="dark"
            style={[styles.glassTab, { borderColor: "rgba(70,241,197,0.18)" }]}
          >
            <View style={styles.sectionCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>
                  {t("accountTypes.income")}
                </Text>
                <View style={styles.sectionAmountRow}>
                  <Text
                    style={[
                      styles.sectionTotal,
                      { color: colors.primaryGreen },
                      hiddenTypes.has("income") && styles.blur,
                    ]}
                  >
                    {formatNumber(periodTotals.incomeTotal)}{" "}
                    {getCurrencyMeta(mainCurrency).symbol}
                  </Text>
                  {incomeBudgetTotal > 0 && (
                    <View style={styles.sectionBudgetBadge}>
                      <Feather name="target" size={10} color={colors.gray} />
                      <Text
                        style={[
                          styles.sectionBudgetText,
                          hiddenTypes.has("income") && styles.blur,
                        ]}
                      >
                        {formatNumber(incomeBudgetTotal)}{" "}
                        {getCurrencyMeta(mainCurrency).symbol}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleHidden("income")}>
                <Feather
                  name={hiddenTypes.has("income") ? "eye-off" : "eye"}
                  size={18}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
            {renderPagedGrid(
              Accounts.filter((a) => a.type === "income" && a.title !== "New account"),
              1, incPage, setIncPage, "income",
            )}
          </BlurView>

          {/* PERSONAL — 1 row horizontal scroll */}
          <BlurView
            intensity={20}
            tint="dark"
            style={[styles.glassTab, { borderColor: "rgba(255,255,255,0.10)" }]}
          >
            <View style={styles.sectionCard}>
              <View>
                <Text style={styles.sectionLabel}>
                  {t("accountTypes.personal")}
                </Text>
                <Text
                  style={[
                    styles.sectionTotal,
                    hiddenTypes.has("personal") && styles.blur,
                  ]}
                >
                  {formatNumber(periodTotals.personalNet)}{" "}
                  {getCurrencyMeta(mainCurrency).symbol}
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleHidden("personal")}>
                <Feather
                  name={hiddenTypes.has("personal") ? "eye-off" : "eye"}
                  size={18}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
            {renderPagedGrid(
              Accounts.filter((a) => a.type === "personal" && a.title !== "New account"),
              2, perPage, setPerPage, "personal",
              [
                ...(debtSettings.enabled ? [DEBTS_TILE] : []),
                ...(assetSettings.enabled ? [ASSETS_TILE] : []),
              ],
            )}
          </BlurView>

          {/* EXPENSES — 2 rows horizontal scroll */}
          <BlurView
            intensity={20}
            tint="dark"
            style={[styles.glassTab, { borderColor: "rgba(255,178,190,0.18)" }]}
          >
            <View style={styles.sectionCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>
                  {t("accountTypes.expenses")}
                </Text>
                <View style={styles.sectionAmountRow}>
                  <Text
                    style={[
                      styles.sectionTotal,
                      { color: colors.red },
                      hiddenTypes.has("expense") && styles.blur,
                    ]}
                  >
                    {formatNumber(periodTotals.expenseTotal)}{" "}
                    {getCurrencyMeta(mainCurrency).symbol}
                  </Text>
                  {expenseBudgetTotal > 0 && (
                    <View
                      style={[
                        styles.sectionBudgetBadge,
                        {
                          borderColor: "rgba(255,178,190,0.25)",
                          backgroundColor: "rgba(255,178,190,0.08)",
                        },
                      ]}
                    >
                      <Feather name="target" size={10} color={colors.gray} />
                      <Text
                        style={[
                          styles.sectionBudgetText,
                          hiddenTypes.has("expense") && styles.blur,
                        ]}
                      >
                        {formatNumber(expenseBudgetTotal)}{" "}
                        {getCurrencyMeta(mainCurrency).symbol}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleHidden("expense")}>
                <Feather
                  name={hiddenTypes.has("expense") ? "eye-off" : "eye"}
                  size={18}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
            {renderPagedGrid(
              Accounts.filter((a) => a.type === "expense" && a.title !== "New account"),
              3, expPage, setExpPage, "expense",
            )}
          </BlurView>
        </View>
      </View>

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

// 40px scroll padding + 4 tiles × 6px margin each = 64px total non-tile space
const TILE_W = 72;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Glass tab container
  glassTab: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    padding: 2,
  },
  // Section header card
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sectionLabel: {
    color: colors.gray,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
    opacity: 0.7,
  },
  sectionTotal: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  sectionAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  sectionBudgetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(70,241,197,0.25)",
    backgroundColor: "rgba(70,241,197,0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionBudgetText: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "600",
  },
  // Glass account tiles — Liquid Glass
  glassTile: {
    width: TILE_W,
    margin: 3,
    borderRadius: 14,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  liquidRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  liquidGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tileIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 3,
  },
  tileName: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 8,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 3,
    width: "100%",
  },
  tileAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "nowrap",
    gap: 1,
    paddingHorizontal: 3,
  },
  tileAmount: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  tileCurrency: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 8,
    fontWeight: "600",
    flexShrink: 0,
  },
  tileBudget: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    flexShrink: 0,
  },
  addTileWrapper: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    zIndex: 10,
  },
  // Row / grid layouts
  rowSection: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
  },
  verticalGridContent: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingRight: 4,
  },
  verticalGrid: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  expensesScrollView: {
    height: 234, // 3 rows * (72 tile height + 6 margin)
  },
  personalScrollView: {
    height: 156, // 2 rows * (72 tile height + 6 margin)
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingTop: 6,
    paddingBottom: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  blur: {
    opacity: 0.3,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
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
