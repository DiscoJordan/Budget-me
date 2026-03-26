import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../styles/styles";
import { Transaction } from "../../src/types";
import { toMainCurrency } from "../../utils/convertCurrency";
import TransactionRow from "./TransactionRow";
import { getCurrencyMeta } from "../../utils/currencyInfo";

interface Props {
  date: string;
  transactions: Transaction[];
  activeAccountId?: string;
  currency?: string;
  rates?: Record<string, number>;
  mainCurrency?: string;
  accounts?: { _id: string; name: string; parentId?: string }[];
  onTransactionPress?: (transaction: Transaction) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return date.toLocaleDateString("en-EN", options);
}

function getDayTotal(
  transactions: Transaction[],
  rates: Record<string, number>,
  mainCurrency: string,
  activeAccountId?: string,
): number {
  return transactions.reduce((acc, transaction) => {
    const sender = transaction.senderId as any;
    const recipient = transaction.recipientId as any;
    const isPersonalTransfer =
      sender?.type === "personal" && recipient?.type === "personal";
    if (isPersonalTransfer) return acc;
    const converted = toMainCurrency(
      transaction.amount ?? 0,
      transaction.currency ?? "USD",
      rates,
      mainCurrency,
    );
    if (sender?.type === "income") return acc + converted;
    if (sender?.type === "debt" && recipient?.type === "personal")
      return acc + converted;
    return acc - converted;
  }, 0);
}

export default function DaySection({
  date,
  transactions,
  activeAccountId,
  currency,
  rates = {},
  mainCurrency = "USD",
  accounts,
  onTransactionPress,
}: Props) {
  const total = getDayTotal(transactions, rates, mainCurrency, activeAccountId);

  return (
    <View>
      <View style={styles.day}>
        <Text style={styles.dayText}>{formatDate(date)}</Text>
        <Text style={styles.dayText}>
          {total > 0 ? "+" : ""}
          {total.toLocaleString()} {getCurrencyMeta(currency).symbol}
        </Text>
      </View>
      {transactions.map((transaction) => (
        <TransactionRow
          key={transaction._id}
          transaction={transaction}
          currency={currency}
          accounts={accounts}
          onPress={onTransactionPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  day: {
    backgroundColor: "rgba(0,159,156,0.4)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
});
