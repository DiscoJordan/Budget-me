import React, { useContext, useEffect, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { TransactionsContext } from "../context/TransactionsContext";
import { UsersContext } from "../context/UsersContext";
import { Transaction } from "../src/types";
import { CurrencyContext } from "../context/CurrencyContext";
import { AccountingPeriodContext } from "../context/AccountingPeriodContext";
import { colors, body, largeTitle, title2 } from "../styles/styles";
import { formatNumber } from "../utils/formatNumber";
import { toMainCurrency } from "../utils/convertCurrency";
import DaySection from "../components/account/DaySection";

function groupByDate(transactions: any[]): Record<string, any[]> {
  return transactions.reduce((acc, t) => {
    const date = new Date(t.time).toISOString().split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {} as Record<string, any[]>);
}

function calcFlows(transactions: Transaction[], rates: Record<string, number>, mainCurrency: string) {
  let inflows = 0;
  let outflows = 0;
  for (const t of transactions) {
    const senderType = (t.senderId as any)?.type;
    const recipientType = (t.recipientId as any)?.type;
    const converted = toMainCurrency(t.amount, t.currency ?? "USD", rates, mainCurrency);
    if (senderType === "income" && recipientType === "personal") inflows += converted;
    else if (senderType === "personal" && recipientType === "expense") outflows += converted;
  }
  return { inflows, outflows };
}

function netBalanceColor(net: number): string {
  if (net === 0) return "white";
  return net > 0 ? colors.green : colors.red;
}

function History({ navigation }: { navigation: any }) {
  const { transactions, getTransactionsOfUser, setActiveTransaction } = useContext(TransactionsContext);
  const { user } = useContext(UsersContext);
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
  const net = inflows - outflows;

  const grouped = groupByDate(filtered);
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  sortedDates.forEach((date) => {
    grouped[date].sort(
      (a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  });

  return (
    <View style={styles.screen}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {filtered.length > 0 && (
          <View style={styles.summary}>
            <View style={styles.summaryCard}>
              <Text style={[body, { color: colors.gray }]}>Inflows</Text>
              <Text style={[title2, { color: colors.green }]}>
                {formatNumber(inflows)} {mainCurrency}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[body, { color: colors.gray }]}>Net balance</Text>
              <Text style={[largeTitle, { color: netBalanceColor(net) }]}>
                {formatNumber(net)} {mainCurrency}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[body, { color: colors.gray }]}>Outflows</Text>
              <Text style={[title2, { color: colors.red }]}>
                {formatNumber(outflows)} {mainCurrency}
              </Text>
            </View>
          </View>
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
  summary: {
    flexDirection: "column",
    padding: 16,
    gap: 8,
  },
  summaryCard: {
    backgroundColor: colors.darkBlack,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  empty: {
    color: colors.gray,
    ...body,
    padding: 20,
  },
});

export default History;
