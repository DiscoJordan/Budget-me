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

export default function IncomeTab({ data, currency }: Props) {
  const sym = getCurrencyMeta(currency).symbol;
  const { insights } = data;

  return (
    <View style={styles.container}>
      <DonutBreakdown
        data={data.incomeBreakdown}
        total={data.totalIncome}
        currency={currency}
        label="Income"
      />

      <View style={styles.insights}>
        {insights.topIncome && (
          <InsightCard
            icon="star"
            label={`Top source: ${insights.topIncome.name}`}
            value={`${formatNumber(insights.topIncome.amount)} ${sym}`}
            hint="The income source that brought in the most money during this period."
          />
        )}
        <InsightCard
          icon="calendar-today"
          label="Daily average"
          value={`${formatNumber(insights.dailyAvgIncome)} ${sym}`}
          hint="Total income divided by the number of days in this period."
        />
        {insights.incomeChange !== null && (
          <InsightCard
            icon="chart-line-variant"
            label="vs previous period"
            value={`${insights.incomeChange > 0 ? "+" : ""}${insights.incomeChange.toFixed(1)}%`}
            valueColor={insights.incomeChange > 0 ? "#44FFBC" : "#FF5959"}
            hint="How your income changed compared to the previous period. Green (+) means you earned more."
          />
        )}
        {insights.savingsRate !== 0 && (
          <InsightCard
            icon="piggy-bank"
            label="Savings rate"
            value={`${insights.savingsRate.toFixed(1)}%`}
            valueColor={insights.savingsRate >= 0 ? "#44FFBC" : "#FF5959"}
            hint="Percentage of income you kept after expenses. Calculated as (Income - Expenses) / Income * 100."
          />
        )}
        <InsightCard
          icon="counter"
          label="Income days"
          value={`${insights.daysWithTransactions}`}
          hint="Number of unique days that had at least one income or expense transaction."
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
