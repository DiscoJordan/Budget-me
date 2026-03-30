import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../../styles/styles";
import { Transaction } from "../../src/types";
import { toMainCurrency } from "../../utils/convertCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { getCurrencyMeta } from "../../utils/currencyInfo";

interface Props {
  subcat: string;
  transactions: Transaction[];
  totalAmount: number;
  currency?: string;
  rates?: Record<string, number>;
  mainCurrency?: string;
}

export default function SubcategoryBar({ subcat, transactions, totalAmount, currency, rates, mainCurrency }: Props) {
  const { t } = useTranslation();
  const amountOfSubcat = transactions.reduce((acc, t) => {
    if (rates && mainCurrency) {
      return acc + toMainCurrency(t.amount ?? 0, t.currency ?? "USD", rates, mainCurrency);
    }
    return acc + t.amount;
  }, 0);
  const percentage = totalAmount > 0 ? ((amountOfSubcat / totalAmount) * 100) : 0;
  const lineSize = percentage.toFixed(1);
  const displayCurrency = mainCurrency ?? currency ?? "USD";

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>
          {subcat.length > 0 ? subcat : t("account.noSubcategory")} {lineSize}%
        </Text>
        <Text style={styles.label}>
          {formatNumber(amountOfSubcat)} {getCurrencyMeta(displayCurrency).symbol}
        </Text>
      </View>
      <View style={[styles.bar, { width: `${Math.min(Number(lineSize), 100)}%` as any }]} />
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
