import React, { useContext, useEffect, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { TransactionsContext } from "../context/TransactionsContext";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";
import { Transaction } from "../src/types";
import { CurrencyContext } from "../context/CurrencyContext";
import { AccountingPeriodContext } from "../context/AccountingPeriodContext";
import { colors, body } from "../styles/styles";
import { toMainCurrency } from "../utils/convertCurrency";
import DaySection from "../components/account/DaySection";
import FlowSummary from "../components/FlowSummary";

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

function calcFlows(
  transactions: Transaction[],
  rates: Record<string, number>,
  mainCurrency: string,
) {
  let inflows = 0;
  let outflows = 0;
  for (const t of transactions) {
    const senderType = (t.senderId as any)?.type;
    const recipientType = (t.recipientId as any)?.type;
    const converted = toMainCurrency(
      t.amount,
      t.currency ?? "USD",
      rates,
      mainCurrency,
    );
    if (senderType === "income" && recipientType === "personal")
      inflows += converted;
    else if (senderType === "personal" && recipientType === "expense")
      outflows += converted;
  }
  return { inflows, outflows };
}

function History({ navigation }: { navigation: any }) {
  const { transactions, getTransactionsOfUser, setActiveTransaction } =
    useContext(TransactionsContext);
  const { user } = useContext(UsersContext);
  const { accounts } = useContext(AccountsContext);
  const { rates, mainCurrency } = useContext(CurrencyContext);
  const { dateFrom, dateTo } = useContext(AccountingPeriodContext);

  const handleTransactionPress = (transaction: Transaction) => {
    setActiveTransaction(transaction);
    navigation.navigate("Edit transaction");
  };

  useEffect(() => {
    getTransactionsOfUser();
  }, []);

  const filtered = useMemo(() => {
    if (!dateFrom && !dateTo) return transactions;
    return transactions.filter((t) => {
      const time = new Date(t.time).getTime();
      if (dateFrom && time < dateFrom.getTime()) return false;
      if (dateTo && time > dateTo.getTime()) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  const { inflows, outflows } = calcFlows(filtered, rates, mainCurrency);

  const grouped = groupByDate(filtered);
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
    <View style={styles.screen}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {filtered.length > 0 && (
          <FlowSummary inflows={inflows} outflows={outflows} currency={mainCurrency} />
        )}

        {filtered.length === 0 ? (
          <Text style={styles.empty}>No transactions for this period</Text>
        ) : (
          sortedDates.map((date) => (
            <DaySection
              key={date}
              date={date}
              transactions={grouped[date]}
              currency={mainCurrency}
              rates={rates}
              mainCurrency={mainCurrency}
              accounts={accounts}
              onTransactionPress={handleTransactionPress}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  empty: {
    color: colors.gray,
    ...body,
    padding: 20,
  },
});

export default History;
