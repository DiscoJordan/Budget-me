import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useContext, useEffect } from "react";
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
import SubcategoryBar from "../components/account/SubcategoryBar";
import DaySection from "../components/account/DaySection";
import { getCurrencyMeta } from "../utils/currencyInfo";
import FlowSummary from "../components/FlowSummary";

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
  const { activeAccount, accounts } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);
  const { rates, mainCurrency } = useContext(CurrencyContext);

  const handleTransactionPress = (transaction: Transaction) => {
    setActiveTransaction(transaction);
    navigation.navigate("Edit transaction");
  };

  useEffect(() => {
    getTransactionsOfUser();
  }, []);

  // For multi-accounts, include all sub-account IDs in the filter
  const accountIds = activeAccount?.isMultiAccount
    ? [activeAccount._id, ...accounts.filter((a) => a.parentId === activeAccount._id).map((a) => a._id)]
    : activeAccount ? [activeAccount._id] : [];

  const transactionsOfAccount = transactions.filter((t) => {
    const senderId = (t.senderId as any)?._id;
    const recipientId = (t.recipientId as any)?._id;
    if (activeAccount?.type === "income") return accountIds.includes(senderId);
    if (activeAccount?.type === "personal")
      return accountIds.includes(senderId) || accountIds.includes(recipientId);
    if (activeAccount?.type === "expense")
      return accountIds.includes(recipientId);
    return false;
  });

  const accountCurrency = activeAccount?.currency ?? "USD";
  const totalAmount = transactionsOfAccount.reduce(
    (acc, t) =>
      acc +
      toMainCurrency(t.amount ?? 0, t.currency ?? "USD", rates, mainCurrency),
    0,
  );
  const outflows = transactionsOfAccount.reduce(
    (acc, t) =>
      accountIds.includes((t.senderId as any)?._id)
        ? acc +
          toMainCurrency(
            t.amount ?? 0,
            t.currency ?? "USD",
            rates,
            mainCurrency,
          )
        : acc,
    0,
  );
  const inflows = transactionsOfAccount.reduce(
    (acc, t) =>
      accountIds.includes((t.recipientId as any)?._id)
        ? acc +
          toMainCurrency(
            (t.amount ?? 0) * (t.rate ?? 1),
            (t.recipientId as any)?.currency ?? accountCurrency,
            rates,
            mainCurrency,
          )
        : acc,
    0,
  );

  const triggeredSubcategories = [
    ...new Set(transactionsOfAccount.map((t) => t.subcategory)),
  ];

  const grouped = groupByDate(transactionsOfAccount);
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
        {activeAccount?.type !== "personal" && (
          <View style={styles.summaryBlock}>
            <View style={{ gap: 8, alignItems: "center" }}>
              <Text style={{ ...body, color: colors.gray }}>
                {activeAccount?.type === "income" ? "Income" : "Expense"}
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
            </View>
            <View style={{ gap: 8, alignItems: "center" }}>
              <Text style={{ ...body, color: colors.gray }}>~A day</Text>
              <Text style={{ ...title2 }}>
                {(totalAmount / daysInCurrentMonth()).format()}{" "}
                {getCurrencyMeta(mainCurrency).symbol}
              </Text>
            </View>
          </View>
        )}

        {activeAccount?.type === "personal" && (
          <>
            {/* Current balance */}
            <View style={styles.balanceBlock}>
              {activeAccount.isMultiAccount ? (
                <>
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balanceAmount}>
                    {formatNumber(
                      accounts
                        .filter((a) => a.parentId === activeAccount._id)
                        .reduce(
                          (sum, sub) =>
                            sum + toMainCurrency(sub.balance ?? 0, sub.currency, rates, mainCurrency),
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
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balanceAmount}>
                    {formatNumber(activeAccount.balance)}{" "}
                    {getCurrencyMeta(activeAccount.currency).symbol}
                  </Text>
                </>
              )}
            </View>

            <FlowSummary inflows={inflows} outflows={outflows} currency={mainCurrency} />
          </>
        )}

        <View style={styles.listBlock}>
          {transactionsOfAccount.length > 0 && activeAccount?.type !== "personal" && (
            <>
              <Text style={body}> Subcategories</Text>
              <View>
                {triggeredSubcategories.map((subcat) => (
                  <SubcategoryBar
                    key={subcat}
                    subcat={subcat}
                    transactions={transactionsOfAccount.filter(
                      (t) => t.subcategory === subcat,
                    )}
                    totalAmount={totalAmount}
                    currency={activeAccount?.currency}
                  />
                ))}
              </View>
            </>
          )}
          <Text style={body}> List of operations</Text>
        </View>

        {transactionsOfAccount.length > 0 ? (
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
          <Text style={{ color: "white", paddingLeft: 20 }}>
            No transactions for this period
          </Text>
        )}
      </ScrollView>

      {activeAccount?.type !== "expense" && (
        <TouchableOpacity
          style={submit_button}
          onPress={() => navigation.navigate("New operation")}
        >
          <Text style={submit_button_text}>New transaction</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryBlock: {
    ...container,
    justifyContent: "center",
    alignItems: "center",
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
  listBlock: {
    ...container,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 20,
  },
});

export default Account;
