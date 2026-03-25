import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../styles/styles";
import { Transaction } from "../../src/types";

interface Props {
  subcat: string;
  transactions: Transaction[];
  totalAmount: number;
  currency?: string;
}

export default function SubcategoryBar({ subcat, transactions, totalAmount, currency }: Props) {
  const amountOfSubcat = transactions.reduce((acc, t) => acc + t.amount, 0);
  const lineSize = ((amountOfSubcat / totalAmount) * 100).toFixed(1);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>
          {subcat.length > 0 ? subcat : "No subcategory"} {lineSize}%
        </Text>
        <Text style={styles.label}>
          {amountOfSubcat.toLocaleString()} {currency}
        </Text>
      </View>
      <View style={[styles.bar, { width: `${lineSize}%` as any }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 8,
    padding: 5,
    minWidth: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    width: "100%",
    alignItems: "flex-start",
  },
  label: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  bar: {
    backgroundColor: colors.primaryGreen,
    height: 5,
    borderRadius: 20,
  },
});
