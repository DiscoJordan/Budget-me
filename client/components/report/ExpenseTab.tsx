import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import DonutBreakdown from "./DonutBreakdown";
import InsightCard from "./InsightCard";
import { ReportData } from "../../hooks/useReportData";
import { formatNumber } from "../../utils/formatNumber";
import { getCurrencyMeta } from "../../utils/currencyInfo";

interface Props {
  data: ReportData;
  currency: string;
}

export default function ExpenseTab({ data, currency }: Props) {
  const { t } = useTranslation();
  const sym = getCurrencyMeta(currency).symbol;
  const { insights } = data;

  return (
    <View style={styles.container}>
      <DonutBreakdown
        data={data.expenseBreakdown}
        total={data.totalExpense}
        currency={currency}
        label={t("reportExpense.expenses")}
      />

      <View style={styles.insights}>
        {insights.biggestExpense && (
          <InsightCard
            icon="arrow-top-right"
            label={t("reportExpense.biggest", { name: insights.biggestExpense.name })}
            value={`${formatNumber(insights.biggestExpense.amount)} ${sym}`}
            hint={t("reportExpense.biggestHint")}
          />
        )}
        {insights.biggestTransaction && (
          <InsightCard
            icon="cash-remove"
            label={t("reportExpense.biggestTxn", { name: insights.biggestTransaction.name })}
            value={`${formatNumber(insights.biggestTransaction.amount)} ${sym}`}
            hint={t("reportExpense.biggestTxnHint", { date: insights.biggestTransaction.date })}
          />
        )}
        <InsightCard
          icon="calendar-today"
          label={t("reportExpense.dailyAverage")}
          value={`${formatNumber(insights.dailyAvgExpense)} ${sym}`}
          hint={t("reportExpense.dailyAvgHint")}
        />
        {insights.avgTransactionSize > 0 && (
          <InsightCard
            icon="cash"
            label={t("reportExpense.avgTransaction")}
            value={`${formatNumber(insights.avgTransactionSize)} ${sym}`}
            hint={t("reportExpense.avgTransactionHint")}
          />
        )}
        {insights.highestSpendDay && (
          <InsightCard
            icon="fire"
            label={t("reportExpense.peakSpend", { date: insights.highestSpendDay.date })}
            value={`${formatNumber(insights.highestSpendDay.amount)} ${sym}`}
            valueColor="#FF5959"
            hint={t("reportExpense.peakSpendHint")}
          />
        )}
        {insights.mostActiveCategory && (
          <InsightCard
            icon="repeat"
            label={t("reportExpense.mostFrequent", { name: insights.mostActiveCategory.name })}
            value={`${insights.mostActiveCategory.count} txns`}
            hint={t("reportExpense.mostFrequentHint")}
          />
        )}
        {insights.expenseChange !== null && (
          <InsightCard
            icon="chart-line-variant"
            label={t("reportExpense.vsPrevPeriod")}
            value={`${insights.expenseChange > 0 ? "+" : ""}${insights.expenseChange.toFixed(1)}%`}
            valueColor={insights.expenseChange > 0 ? "#FF5959" : "#44FFBC"}
            hint={t("reportExpense.vsPrevPeriodHint")}
          />
        )}
        <InsightCard
          icon="counter"
          label={t("reportExpense.transactions")}
          value={t("reportExpense.transactionsValue", { count: insights.totalTransactions, days: insights.daysWithTransactions })}
          hint={t("reportExpense.transactionsHint")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
  },
  insights: {
    gap: 6,
  },
});
