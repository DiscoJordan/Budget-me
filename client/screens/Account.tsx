import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
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
  return transactions.reduce((acc, t) => {
    const date = new Date(t.time).toISOString().split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {} as Record<string, any[]>);
}

const Account = ({ navigation }: { navigation: any }) => {
  const { transactions, getTransactionsOfUser, setActiveTransaction } = useContext(TransactionsContext);
  const { activeAccount } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);
  const { rates, mainCurrency } = useContext(CurrencyContext);

  const handleTransactionPress = (transaction: Transaction) => {
    setActiveTransaction(transaction);
    navigation.navigate("Edit transaction");
  };

  useEffect(() => {
    getTransactionsOfUser();
  }, []);

  const transactionsOfAccount = transactions.filter((t) => {
    const senderId = (t.senderId as any)?._id;
    const recipientId = (t.recipientId as any)?._id;
    if (activeAccount?.type === "income") return senderId === activeAccount._id;
    if (activeAccount?.type === "personal") return senderId === activeAccount._id || recipientId === activeAccount._id;
    if (activeAccount?.type === "expense") return recipientId === activeAccount._id;
    return false;
  });

  const accountCurrency = activeAccount?.currency ?? "USD";
  const totalAmount = transactionsOfAccount.reduce(
    (acc, t) => acc + toMainCurrency(t.amount ?? 0, t.currency ?? "USD", rates, mainCurrency),
    0
  );
  const outflows = transactionsOfAccount.reduce(
    (acc, t) =>
      (t.senderId as any)?._id === activeAccount?._id
        ? acc + toMainCurrency(t.amount ?? 0, t.currency ?? "USD", rates, mainCurrency)
        : acc,
    0,
  );
  const inflows = transactionsOfAccount.reduce(
    (acc, t) =>
      (t.recipientId as any)?._id === activeAccount?._id
        ? acc + toMainCurrency((t.amount ?? 0) * (t.rate ?? 1), accountCurrency, rates, mainCurrency)
        : acc,
    0,
  );

  const triggeredSubcategories = [...new Set(transactionsOfAccount.map((t) => t.subcategory))];

  const grouped = groupByDate(transactionsOfAccount);
  const sortedDates = Object.keys(grouped)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  sortedDates.forEach((date) => {
    grouped[date].sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
  });

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ minHeight: "100%", width: "100%", backgroundColor: colors.background }}
      >
        {activeAccount?.type !== "personal" && (
          <View style={styles.summaryBlock}>
            <View style={{ gap: 8, alignItems: "center" }}>
              <Text style={{ ...body, color: colors.gray }}>
                {activeAccount?.type === "income" ? "Income" : "Expense"}
              </Text>
              <Text style={{ ...largeTitle, color: activeAccount?.type === "income" ? colors.green : colors.red }}>
                {totalAmount.format()} {mainCurrency}
              </Text>
            </View>
            <View style={{ gap: 8, alignItems: "center" }}>
              <Text style={{ ...body, color: colors.gray }}>~A day</Text>
              <Text style={{ ...title2 }}>
                {(totalAmount / daysInCurrentMonth()).format()} {mainCurrency}
              </Text>
            </View>
          </View>
        )}

        {activeAccount?.type === "personal" && (
          <View style={styles.inOutFlows}>
            <View style={styles.inOutFlow}>
              <Text style={{ ...body, color: colors.gray }}>Inflows</Text>
              <Text style={{ ...title2, color: colors.green }}>
                {inflows.format()} {mainCurrency}
              </Text>
            </View>
            <View style={styles.inOutFlow}>
              <Text style={{ ...body, color: colors.gray }}>Net balance</Text>
              <Text style={{ ...largeTitle, color: netBalanceColor(inflows - outflows) }}>
                {(inflows - outflows).format()} {mainCurrency}
              </Text>
            </View>
            <View style={styles.inOutFlow}>
              <Text style={{ ...body, color: colors.gray }}>Outflows</Text>
              <Text style={{ ...title2, color: colors.red }}>
                {outflows.format()} {mainCurrency}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.listBlock}>
          {transactionsOfAccount.length > 0 && (
            <>
              <Text style={body}> Subcategories</Text>
              <View>
                {triggeredSubcategories.map((subcat) => (
                  <SubcategoryBar
                    key={subcat}
                    subcat={subcat}
                    transactions={transactionsOfAccount.filter((t) => t.subcategory === subcat)}
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
              onTransactionPress={handleTransactionPress}
            />
          ))
        ) : (
          <Text style={{ color: "white", paddingLeft: 20 }}>No transactions for this period</Text>
        )}
      </ScrollView>

      {activeAccount?.type !== "expense" && (
        <TouchableOpacity style={submit_button} onPress={() => navigation.navigate("New operation")}>
          <Text style={submit_button_text}>New transaction</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

function netBalanceColor(net: number): string {
  if (net === 0) return "white";
  return net > 0 ? colors.green : colors.red;
}

const styles = StyleSheet.create({
  summaryBlock: {
    ...container,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  inOutFlows: {
    ...container,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  inOutFlow: {
    backgroundColor: colors.darkBlack,
    alignItems: "center",
    padding: 16,
    width: "100%",
    borderRadius: 20,
    gap: 8,
  },
  listBlock: {
    ...container,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 20,
  },
});

export default Account;
