import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import React, {
  useContext,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  container,
  body,
  largeTitle,
  submit_button,
  submit_button_text,
  colors,
  title2,
} from "../styles/styles";
import { AccountsContext } from "../context/AccountsContext";
import { UsersContext } from "../context/UsersContext";
import { TransactionsContext } from "../context/TransactionsContext";
import { Transaction } from "../src/types";
import { CurrencyContext } from "../context/CurrencyContext";
import { formatNumber } from "../utils/formatNumber";
import { toMainCurrency } from "../utils/convertCurrency";
import { useTranslation } from "react-i18next";
import PeriodBarChart from "../components/PeriodBarChart";
import { AccountingPeriodContext, computeRange } from "../context/AccountingPeriodContext";
import { getBudgetFromAccount, setBudget } from "../utils/budgetStorage";
import SubcategoryBar from "../components/account/SubcategoryBar";
import DaySection from "../components/account/DaySection";
import { getCurrencyMeta } from "../utils/currencyInfo";
import FlowSummary from "../components/FlowSummary";
import PeriodNavigator from "../components/PeriodNavigator";

// Extend Number with legacy .format() used in this screen
declare global {
  interface Number {
    format(): string;
  }
}

Number.prototype.format = function () {
  return formatNumber(this.valueOf());
};

function daysInCurrentMonth(): number {
  const now = new Date();
  return 33 - new Date(now.getFullYear(), now.getMonth(), 33).getDate();
}

function groupByDate(transactions: any[]): Record<string, any[]> {
  return transactions.reduce(
    (acc, t) => {
      const date = new Date(t.time).toISOString().split("T")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    },
    {} as Record<string, any[]>,
  );
}

const Account = ({ navigation }: { navigation: any }) => {
  const { transactions, getTransactionsOfUser, setActiveTransaction } =
    useContext(TransactionsContext);
  const { activeAccount, accounts, setActiveAccount, setRecipientAccount } =
    useContext(AccountsContext);
  const { user } = useContext(UsersContext);
  const { rates, mainCurrency } = useContext(CurrencyContext);
  const { periodType, dateFrom, dateTo, offset: periodOffset, headerLabel } = useContext(AccountingPeriodContext);
  const { t } = useTranslation();

  const handleTransactionPress = (transaction: Transaction) => {
    setActiveTransaction(transaction);
    navigation.navigate("Edit transaction");
  };

  useEffect(() => {
    getTransactionsOfUser();
  }, []);

  // Sync activeAccount with latest accounts data when screen regains focus
  useFocusEffect(
    useCallback(() => {
      if (activeAccount) {
        const fresh = accounts.find((a) => a._id === activeAccount._id);
        if (fresh && fresh !== activeAccount) {
          setActiveAccount(fresh);
        }
      }
    }, [accounts, activeAccount]),
  );

  // For multi-accounts, include all sub-account IDs in the filter
  const accountIds = activeAccount?.isMultiAccount
    ? [
        activeAccount._id,
        ...accounts
          .filter((a) => a.parentId === activeAccount._id)
          .map((a) => a._id),
      ]
    : activeAccount
      ? [activeAccount._id]
      : [];

  const transactionsOfAccount = transactions.filter((t) => {
    const senderId = (t.senderId as any)?._id;
    const recipientId = (t.recipientId as any)?._id;
    if (activeAccount?.type === "income") return accountIds.includes(senderId);
    if (activeAccount?.type === "personal")
      return accountIds.includes(senderId) || accountIds.includes(recipientId);
    if (activeAccount?.type === "expense")
      return accountIds.includes(recipientId);
    if (activeAccount?.type === "debt")
      return accountIds.includes(senderId) || accountIds.includes(recipientId);
    return false;
  });

  const [search, setSearch] = useState("");
  const [budget, setBudgetState] = useState(0);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const isIncomeOrExpense =
    activeAccount?.type === "income" || activeAccount?.type === "expense";

  useEffect(() => {
    if (activeAccount?._id && isIncomeOrExpense) {
      setBudgetState(getBudgetFromAccount(activeAccount, periodType));
    }
  }, [activeAccount?._id, periodType]);

  // Filter by period for income/expense
  const periodFiltered = useMemo(() => {
    if (!isIncomeOrExpense || (!dateFrom && !dateTo))
      return transactionsOfAccount;
    return transactionsOfAccount.filter((t) => {
      const time = new Date(t.time).getTime();
      if (dateFrom && time < dateFrom.getTime()) return false;
      if (dateTo && time > dateTo.getTime()) return false;
      return true;
    });
  }, [transactionsOfAccount, dateFrom, dateTo, isIncomeOrExpense]);

  // Search filter for income/expense
  const searchFiltered = useMemo(() => {
    if (!isIncomeOrExpense) return transactionsOfAccount;
    const q = search.trim().toLowerCase();
    if (!q) return periodFiltered;
    return periodFiltered.filter((t) => {
      const senderName = ((t.senderId as any)?.name ?? "").toLowerCase();
      const recipientName = ((t.recipientId as any)?.name ?? "").toLowerCase();
      const comment = (t.comment ?? "").toLowerCase();
      const amount = t.amount.toString();
      const subcategory = (t.subcategory ?? "").toLowerCase();
      const date = new Date(t.time).toLocaleDateString();
      const isoDate = new Date(t.time).toISOString().split("T")[0];
      return (
        senderName.includes(q) ||
        recipientName.includes(q) ||
        comment.includes(q) ||
        amount.includes(q) ||
        subcategory.includes(q) ||
        date.includes(q) ||
        isoDate.includes(q)
      );
    });
  }, [periodFiltered, search, isIncomeOrExpense, transactionsOfAccount]);

  // Use filtered list for display in income/expense, raw for others
  const displayTransactions = isIncomeOrExpense
    ? searchFiltered
    : transactionsOfAccount;

  const accountCurrency = activeAccount?.currency ?? "USD";
  const totalAmount = (
    isIncomeOrExpense ? periodFiltered : transactionsOfAccount
  ).reduce(
    (acc, t) =>
      acc +
      toMainCurrency(t.amount ?? 0, t.currency ?? "USD", rates, mainCurrency),
    0,
  );
  // Previous period comparison for income/expense
  const { prevTotal, daysInPeriod, prevDaysInPeriod } = useMemo(() => {
    if (!isIncomeOrExpense || periodType === "all" || periodType === "custom") {
      return { prevTotal: 0, daysInPeriod: daysInCurrentMonth(), prevDaysInPeriod: daysInCurrentMonth() };
    }
    const now = new Date();
    const prev = computeRange(periodType, now, periodOffset - 1);
    const curr = computeRange(periodType, now, periodOffset);

    const currDays = curr.from && curr.to
      ? Math.max(1, Math.round((curr.to.getTime() - curr.from.getTime()) / 86400000) + 1)
      : daysInCurrentMonth();
    const prevDays = prev.from && prev.to
      ? Math.max(1, Math.round((prev.to.getTime() - prev.from.getTime()) / 86400000) + 1)
      : daysInCurrentMonth();

    let sum = 0;
    if (prev.from && prev.to) {
      for (const t of transactionsOfAccount) {
        const time = new Date(t.time).getTime();
        if (time >= prev.from.getTime() && time <= prev.to.getTime()) {
          sum += toMainCurrency(t.amount ?? 0, t.currency ?? "USD", rates, mainCurrency);
        }
      }
    }
    return { prevTotal: sum, daysInPeriod: currDays, prevDaysInPeriod: prevDays };
  }, [isIncomeOrExpense, periodType, periodOffset, transactionsOfAccount, rates, mainCurrency]);

  const totalDiff = totalAmount - prevTotal;
  const totalPctChange = prevTotal > 0 ? ((totalAmount - prevTotal) / prevTotal) * 100 : 0;
  const dailyAvg = totalAmount / daysInPeriod;
  const prevDailyAvg = prevTotal / prevDaysInPeriod;
  const dailyDiff = dailyAvg - prevDailyAvg;

  const outflows = transactionsOfAccount.reduce((acc, t) => {
    const senderType = (t.senderId as any)?.type;
    const recipientType = (t.recipientId as any)?.type;
    if (senderType === "debt" || recipientType === "debt") return acc;
    return accountIds.includes((t.senderId as any)?._id)
      ? acc +
          toMainCurrency(
            t.amount ?? 0,
            t.currency ?? "USD",
            rates,
            mainCurrency,
          )
      : acc;
  }, 0);
  const inflows = transactionsOfAccount.reduce((acc, t) => {
    const senderType = (t.senderId as any)?.type;
    const recipientType = (t.recipientId as any)?.type;
    if (senderType === "debt" || recipientType === "debt") return acc;
    return accountIds.includes((t.recipientId as any)?._id)
      ? acc +
          toMainCurrency(
            (t.amount ?? 0) * (t.rate ?? 1),
            (t.recipientId as any)?.currency ?? accountCurrency,
            rates,
            mainCurrency,
          )
      : acc;
  }, 0);

  const triggeredSubcategories = [
    ...new Set((isIncomeOrExpense ? periodFiltered : transactionsOfAccount).map((t) => t.subcategory)),
  ];

  const grouped = groupByDate(displayTransactions);
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  sortedDates.forEach((date) => {
    grouped[date].sort(
      (a: any, b: any) =>
        new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  });

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{
          minHeight: "100%",
          width: "100%",
          backgroundColor: colors.background,
        }}
      >
        {activeAccount?.type === "debt" && (
          <View style={styles.debtSummary}>
            <View
              style={[
                styles.debtAvatarLarge,
                {
                  backgroundColor: activeAccount.icon?.color || colors.darkGray,
                },
              ]}
            >
              <Text style={styles.debtAvatarLetter}>
                {activeAccount.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              style={{
                ...largeTitle,
                color:
                  (activeAccount.balance ?? 0) >= 0 ? colors.green : colors.red,
              }}
            >
              {(activeAccount.balance ?? 0) >= 0 ? "+" : ""}
              {formatNumber(activeAccount.balance ?? 0)}{" "}
              {getCurrencyMeta(activeAccount.currency).symbol}
            </Text>
            <Text style={{ ...body, color: colors.gray }}>
              {(activeAccount.balance ?? 0) > 0
                ? t("account.owesYou")
                : (activeAccount.balance ?? 0) < 0
                  ? t("account.youOwe")
                  : t("account.settledUp")}
            </Text>
          </View>
        )}

        {activeAccount?.type !== "personal" &&
          activeAccount?.type !== "debt" && (
            <View style={styles.summaryBlock}>
              <View style={{ gap: 4, alignItems: "center" }}>
                <Text style={{ ...body, color: colors.gray }}>
                  {activeAccount?.type === "income" ? t("accountTypes.income") : t("accountTypes.expense")}
                </Text>
                <Text
                  style={{
                    ...largeTitle,
                    color:
                      activeAccount?.type === "income"
                        ? colors.green
                        : colors.red,
                  }}
                >
                  {totalAmount.format()} {getCurrencyMeta(mainCurrency).symbol}
                </Text>
                {isIncomeOrExpense && prevTotal > 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: totalDiff >= 0 ? colors.green : colors.red,
                    }}
                  >
                    {totalDiff >= 0 ? "+" : ""}{totalPctChange.toFixed(1)}%
                  </Text>
                )}
              </View>
              <View style={{ gap: 4, alignItems: "center" }}>
                <Text style={{ ...body, color: colors.gray }}>{t("account.aDay")}</Text>
                <Text style={{ ...title2 }}>
                  {dailyAvg.format()}{" "}
                  {getCurrencyMeta(mainCurrency).symbol}
                </Text>
                {isIncomeOrExpense && prevDailyAvg > 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: dailyDiff >= 0 ? colors.green : colors.red,
                    }}
                  >
                    {dailyDiff >= 0 ? "+" : ""}{formatNumber(Math.round(dailyDiff * 100) / 100)}{" "}
                    {getCurrencyMeta(mainCurrency).symbol}
                  </Text>
                )}
              </View>
              <View style={{ gap: 4, alignItems: "center" }}>
                <Text style={{ ...body, color: colors.gray }}>{t("account.budget")}</Text>
                <Text style={{ ...title2 }}>
                  {budget > 0
                    ? `${formatNumber(budget)} ${getCurrencyMeta(mainCurrency).symbol}`
                    : t("common.notSet")}
                </Text>
                <TouchableOpacity
                  accessibilityLabel={t("common.change")}
                  onPress={() => {
                    setBudgetInput(budget > 0 ? budget.toString() : "");
                    setBudgetModalVisible(true);
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.primaryGreen, fontWeight: "700" }}>
                    {t("common.change")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        {(activeAccount?.type === "income" ||
          activeAccount?.type === "expense") && (
          <>
            <PeriodNavigator />
            <PeriodBarChart
              transactions={transactionsOfAccount}
              periodType={periodType}
              dateFrom={dateFrom}
              dateTo={dateTo}
              barColor={
                activeAccount?.type === "income" ? colors.green : colors.red
              }
              currency={mainCurrency}
              rates={rates}
              mainCurrency={mainCurrency}
              budget={budget}
            />
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={colors.gray}
                style={{ marginRight: 6 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={t("account.searchTransactions")}
                placeholderTextColor={colors.gray}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>
          </>
        )}

        {activeAccount?.type === "personal" && (
          <>
            {/* Current balance */}
            <View style={styles.balanceBlock}>
              {activeAccount.isMultiAccount ? (
                <>
                  <Text style={styles.balanceLabel}>{t("newAccount.balance")}</Text>
                  <Text style={styles.balanceAmount}>
                    {formatNumber(
                      accounts
                        .filter((a) => a.parentId === activeAccount._id)
                        .reduce(
                          (sum, sub) =>
                            sum +
                            toMainCurrency(
                              sub.balance ?? 0,
                              sub.currency,
                              rates,
                              mainCurrency,
                            ),
                          0,
                        ),
                    )}{" "}
                    {getCurrencyMeta(mainCurrency).symbol}
                  </Text>
                  <View style={styles.subBalanceRow}>
                    {accounts
                      .filter((a) => a.parentId === activeAccount._id)
                      .map((sub) => (
                        <View key={sub._id} style={styles.subBalanceChip}>
                          <Text style={styles.subBalanceCurrency}>
                            {getCurrencyMeta(sub.currency).symbol}
                          </Text>
                          <Text style={styles.subBalanceAmount}>
                            {formatNumber(sub.balance ?? 0)}
                          </Text>
                        </View>
                      ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.balanceLabel}>{t("newAccount.balance")}</Text>
                  <Text style={styles.balanceAmount}>
                    {formatNumber(activeAccount.balance)}{" "}
                    {getCurrencyMeta(activeAccount.currency).symbol}
                  </Text>
                </>
              )}
            </View>

            <FlowSummary
              inflows={inflows}
              outflows={outflows}
              currency={mainCurrency}
            />
          </>
        )}

        {activeAccount?.type === "debt" && (
          <View style={styles.debtActionsInline}>
            <TouchableOpacity
              style={[styles.debtBtn, { backgroundColor: colors.green }]}
              onPress={() => {
                setRecipientAccount(activeAccount);
                setActiveAccount(null);
                navigation.navigate("New operation", { debtMode: "lend" });
              }}
            >
              <Text style={styles.debtBtnText}>
                {(activeAccount.balance ?? 0) < 0 ? t("transaction.debtRepayment") : t("transaction.lent")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.debtBtn, { backgroundColor: colors.red }]}
              onPress={() => {
                setActiveAccount(activeAccount);
                setRecipientAccount({});
                navigation.navigate("New operation", { debtMode: "borrow" });
              }}
            >
              <Text style={styles.debtBtnText}>
                {(activeAccount.balance ?? 0) > 0 ? t("transaction.debtRepayment") : t("transaction.debt")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listBlock}>
          {(isIncomeOrExpense ? periodFiltered : transactionsOfAccount).length > 0 &&
            activeAccount?.type !== "personal" &&
            activeAccount?.type !== "debt" && (
              <>
                <Text style={body}> {t("account.subcategories")}</Text>
                <View>
                  {triggeredSubcategories.map((subcat) => (
                    <SubcategoryBar
                      key={subcat}
                      subcat={subcat}
                      transactions={(isIncomeOrExpense ? periodFiltered : transactionsOfAccount).filter(
                        (t) => t.subcategory === subcat,
                      )}
                      totalAmount={totalAmount}
                      currency={mainCurrency}
                      rates={rates}
                      mainCurrency={mainCurrency}
                    />
                  ))}
                </View>
              </>
            )}
          <Text style={body}> {t("account.listOfOperations")}</Text>
        </View>

        {displayTransactions.length > 0 ? (
          sortedDates.map((date) => (
            <DaySection
              key={date}
              date={date}
              transactions={grouped[date]}
              activeAccountId={activeAccount?._id}
              currency={mainCurrency}
              rates={rates}
              mainCurrency={mainCurrency}
              accounts={accounts}
              onTransactionPress={handleTransactionPress}
            />
          ))
        ) : (
          <Text style={{ color: colors.gray, paddingLeft: 20, paddingTop: 8 }}>
            {search.trim() ? t("account.noMatchingTransactions") : t("account.noTransactionsForPeriod")}
          </Text>
        )}
      </ScrollView>

      {activeAccount?.type === "debt" ? null : activeAccount?.type !==
        "expense" ? (
        <TouchableOpacity
          style={submit_button}
          onPress={() => navigation.navigate("New operation")}
        >
          <Text style={submit_button_text}>{t("account.newTransaction")}</Text>
        </TouchableOpacity>
      ) : null}

      <Modal
        visible={budgetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <View style={styles.budgetOverlay}>
          <View style={styles.budgetSheet}>
            <Text style={styles.budgetTitle}>{t("account.budgetForPeriod", { period: headerLabel })}</Text>
            <TextInput
              style={styles.budgetInput}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
              placeholder={t("account.enterAmount")}
              placeholderTextColor={colors.gray}
              autoFocus
              accessibilityLabel="Budget amount input"
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.budgetCancel}
                onPress={() => setBudgetModalVisible(false)}
                accessibilityLabel={t("common.cancel")}
              >
                <Text style={{ color: colors.gray, fontWeight: "700" }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.budgetSave}
                onPress={() => {
                  const val = parseFloat(budgetInput) || 0;
                  setBudget(activeAccount!._id, periodType, val).then(() => {
                    setBudgetState(val);
                    setBudgetModalVisible(false);
                  });
                }}
                accessibilityLabel={t("common.save")}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryBlock: {
    ...container,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    padding: 20,
  },
  balanceBlock: {
    backgroundColor: colors.darkBlack,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  balanceLabel: {
    color: colors.gray,
    fontSize: 13,
    fontWeight: "600",
  },
  balanceAmount: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  subBalanceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subBalanceChip: {
    backgroundColor: colors.darkGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    gap: 2,
  },
  subBalanceCurrency: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "600",
  },
  subBalanceAmount: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlack,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 15,
    paddingVertical: 10,
  },
  listBlock: {
    ...container,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 20,
  },
  debtSummary: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  debtAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  debtAvatarLetter: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
  },
  debtActionsInline: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  debtBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  debtBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  budgetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  budgetSheet: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  budgetTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  budgetInput: {
    backgroundColor: colors.darkBlack,
    color: "white",
    fontSize: 18,
    padding: 12,
    borderRadius: 10,
    width: "100%",
    textAlign: "center",
  },
  budgetCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.darkGray,
    alignItems: "center",
  },
  budgetSave: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.primaryGreen,
    alignItems: "center",
  },
});

export default Account;
