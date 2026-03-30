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

export default function IncomeTab({ data, currency }: Props) {
  const { t } = useTranslation();
  const sym = getCurrencyMeta(currency).symbol;
  const { insights } = data;

  return (
    <View style={styles.container}>
      <DonutBreakdown
        data={data.incomeBreakdown}
        total={data.totalIncome}
        currency={currency}
        label={t("reportIncome.income")}
      />

      <View style={styles.insights}>
        {insights.topIncome && (
          <InsightCard
            icon="star"
            label={t("reportIncome.topSource", { name: insights.topIncome.name })}
            value={`${formatNumber(insights.topIncome.amount)} ${sym}`}
            hint={t("reportIncome.topSourceHint")}
          />
        )}
        <InsightCard
          icon="calendar-today"
          label={t("reportIncome.dailyAverage")}
          value={`${formatNumber(insights.dailyAvgIncome)} ${sym}`}
          hint={t("reportIncome.dailyAvgHint")}
        />
        {insights.incomeChange !== null && (
          <InsightCard
            icon="chart-line-variant"
            label={t("reportIncome.vsPrevPeriod")}
            value={`${insights.incomeChange > 0 ? "+" : ""}${insights.incomeChange.toFixed(1)}%`}
            valueColor={insights.incomeChange > 0 ? "#44FFBC" : "#FF5959"}
            hint={t("reportIncome.vsPrevPeriodHint")}
          />
        )}
        {insights.savingsRate !== 0 && (
          <InsightCard
            icon="piggy-bank"
            label={t("reportIncome.savingsRate")}
            value={`${insights.savingsRate.toFixed(1)}%`}
            valueColor={insights.savingsRate >= 0 ? "#44FFBC" : "#FF5959"}
            hint={t("reportIncome.savingsRateHint")}
          />
        )}
        <InsightCard
          icon="counter"
          label={t("reportIncome.incomeDays")}
          value={`${insights.daysWithTransactions}`}
          hint={t("reportIncome.incomeDaysHint")}
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
