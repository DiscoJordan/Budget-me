import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../styles/styles";
import { formatNumber } from "../utils/formatNumber";
import { getCurrencyMeta } from "../utils/currencyInfo";

interface Props {
  inflows: number;
  outflows: number;
  currency: string;
}

function netColor(net: number): string {
  if (net === 0) return "white";
  return net > 0 ? colors.green : colors.red;
}

export default function FlowSummary({ inflows, outflows, currency }: Props) {
  const { t } = useTranslation();
  const net = inflows - outflows;
  const symbol = getCurrencyMeta(currency).symbol;

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.label}>{t("flow.inflows")}</Text>
        <Text style={[styles.amount, { color: colors.green }]}>
          +{formatNumber(inflows)} {symbol}
        </Text>
      </View>
      <View style={[styles.card, styles.cardCenter]}>
        <Text style={styles.label}>{t("flow.net")}</Text>
        <Text style={[styles.amount, { color: netColor(net) }]}>
          {formatNumber(net)} {symbol}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>{t("flow.outflows")}</Text>
        <Text style={[styles.amount, { color: colors.red }]}>
          -{formatNumber(outflows)} {symbol}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: colors.darkBlack,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 4,
  },
  cardCenter: {
    flex: 1.2,
  },
  label: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "600",
  },
  amount: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
