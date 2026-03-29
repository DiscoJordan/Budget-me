import React from "react";
import { View, StyleSheet } from "react-native";
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
  const sym = getCurrencyMeta(currency).symbol;
  const { insights } = data;

  return (
    <View style={styles.container}>
      <DonutBreakdown
        data={data.expenseBreakdown}
        total={data.totalExpense}
        currency={currency}
        label="Expenses"
      />

      <View style={styles.insights}>
        {insights.biggestExpense && (
          <InsightCard
            icon="arrow-top-right"
            label={`Biggest: ${insights.biggestExpense.name}`}
            value={`${formatNumber(insights.biggestExpense.amount)} ${sym}`}
            hint="The expense category where you spent the most money during this period."
          />
        )}
        {insights.biggestTransaction && (
          <InsightCard
            icon="cash-remove"
            label={`Biggest txn: ${insights.biggestTransaction.name}`}
            value={`${formatNumber(insights.biggestTransaction.amount)} ${sym}`}
            hint={`Your single largest expense transaction this period, made on ${insights.biggestTransaction.date}.`}
          />
        )}
        <InsightCard
          icon="calendar-today"
          label="Daily average"
          value={`${formatNumber(insights.dailyAvgExpense)} ${sym}`}
          hint="Total expenses divided by the number of days in this period. Shows how much you spend per day on average."
        />
        {insights.avgTransactionSize > 0 && (
          <InsightCard
            icon="cash"
            label="Avg transaction"
            value={`${formatNumber(insights.avgTransactionSize)} ${sym}`}
            hint="Average size of a single expense transaction. Total expenses divided by number of expense transactions."
          />
        )}
        {insights.highestSpendDay && (
          <InsightCard
            icon="fire"
            label={`Peak spend: ${insights.highestSpendDay.date}`}
            value={`${formatNumber(insights.highestSpendDay.amount)} ${sym}`}
            valueColor="#FF5959"
            hint="The single day when you spent the most money. Only counts days that had at least one transaction."
          />
        )}
        {insights.mostActiveCategory && (
          <InsightCard
            icon="repeat"
            label={`Most frequent: ${insights.mostActiveCategory.name}`}
            value={`${insights.mostActiveCategory.count} txns`}
            hint="The expense category with the most transactions (not necessarily the highest total amount)."
          />
        )}
        {insights.expenseChange !== null && (
          <InsightCard
            icon="chart-line-variant"
            label="vs previous period"
            value={`${insights.expenseChange > 0 ? "+" : ""}${insights.expenseChange.toFixed(1)}%`}
            valueColor={insights.expenseChange > 0 ? "#FF5959" : "#44FFBC"}
            hint="How your expenses changed compared to the previous period. Red (+) means you spent more, green (-) means less."
          />
        )}
        <InsightCard
          icon="counter"
          label="Transactions"
          value={`${insights.totalTransactions} in ${insights.daysWithTransactions} days`}
          hint="Total number of transactions and how many unique days had at least one transaction."
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
