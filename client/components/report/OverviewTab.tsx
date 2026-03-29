import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import FlowSummary from "../FlowSummary";
import InsightCard from "./InsightCard";
import { ReportData } from "../../hooks/useReportData";
import { formatNumber } from "../../utils/formatNumber";
import { getCurrencyMeta } from "../../utils/currencyInfo";
import { colors, font, size } from "../../styles/styles";

const screenWidth = Dimensions.get("window").width;

interface Props {
  data: ReportData;
  currency: string;
}

function OverviewBarChart({ bars }: { bars: ReportData["subPeriodBars"] }) {
  const chartWidth = screenWidth - 72;
  const chartHeight = 180;
  const bottomPad = 24;
  const topPad = 16;
  const leftPad = 0;
  const drawHeight = chartHeight - bottomPad - topPad;

  const maxVal = Math.max(...bars.flatMap((b) => [b.income, b.expense]), 1);
  const groupWidth = (chartWidth - leftPad) / bars.length;
  const barWidth = Math.min(groupWidth * 0.3, 14);
  const gap = 3;

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = topPad + drawHeight * (1 - pct);
        return (
          <Line
            key={pct}
            x1={leftPad}
            y1={y}
            x2={chartWidth}
            y2={y}
            stroke={colors.darkGray}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        );
      })}
      {bars.map((bar, i) => {
        const cx = leftPad + groupWidth * i + groupWidth / 2;
        const incH = (bar.income / maxVal) * drawHeight;
        const expH = (bar.expense / maxVal) * drawHeight;
        return (
          <React.Fragment key={i}>
            {/* Income bar */}
            <Rect
              x={cx - barWidth - gap / 2}
              y={topPad + drawHeight - incH}
              width={barWidth}
              height={Math.max(incH, 1)}
              rx={3}
              fill="#44FFBC"
            />
            {/* Expense bar */}
            <Rect
              x={cx + gap / 2}
              y={topPad + drawHeight - expH}
              width={barWidth}
              height={Math.max(expH, 1)}
              rx={3}
              fill="#FF5959"
            />
            {/* Label */}
            <SvgText
              x={cx}
              y={chartHeight - 4}
              fill={colors.gray}
              fontSize={10}
              textAnchor="middle"
            >
              {bar.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function OverviewTab({ data, currency }: Props) {
  const sym = getCurrencyMeta(currency).symbol;
  const { insights, subPeriodBars } = data;
  const hasData = subPeriodBars.some((b) => b.income > 0 || b.expense > 0);

  return (
    <View style={styles.container}>
      <FlowSummary
        inflows={data.inflows}
        outflows={data.outflows}
        currency={currency}
      />

      {hasData && subPeriodBars.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Income vs Expense</Text>
          <Text style={styles.chartSubtitle}>
            Green bars = income, Red bars = expense per sub-period
          </Text>
          <View style={{ alignItems: "center" }}>
            <OverviewBarChart bars={subPeriodBars} />
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#44FFBC" }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#FF5959" }]} />
              <Text style={styles.legendText}>Expense</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.insights}>
        <InsightCard
          icon="piggy-bank"
          label="Savings rate"
          value={`${insights.savingsRate.toFixed(1)}%`}
          valueColor={insights.savingsRate >= 0 ? "#44FFBC" : "#FF5959"}
          hint="Percentage of income saved after expenses. Calculated as (Income - Expenses) / Income * 100."
        />
        <InsightCard
          icon="calendar-today"
          label="Avg daily expense"
          value={`${formatNumber(insights.dailyAvgExpense)} ${sym}`}
          hint="Total expenses divided by the number of days in this period."
        />
        <InsightCard
          icon="calendar-today"
          label="Avg daily income"
          value={`${formatNumber(insights.dailyAvgIncome)} ${sym}`}
          hint="Total income divided by the number of days in this period."
        />
        {insights.expenseChange !== null && (
          <InsightCard
            icon="chart-line-variant"
            label="Expense vs prev period"
            value={`${insights.expenseChange > 0 ? "+" : ""}${insights.expenseChange.toFixed(1)}%`}
            valueColor={insights.expenseChange > 0 ? "#FF5959" : "#44FFBC"}
            hint="How your total expenses changed compared to the previous period of the same type. Positive means you spent more."
          />
        )}
        {insights.incomeChange !== null && (
          <InsightCard
            icon="chart-line-variant"
            label="Income vs prev period"
            value={`${insights.incomeChange > 0 ? "+" : ""}${insights.incomeChange.toFixed(1)}%`}
            valueColor={insights.incomeChange > 0 ? "#44FFBC" : "#FF5959"}
            hint="How your total income changed compared to the previous period. Positive means you earned more."
          />
        )}
        {insights.bestDay && (
          <InsightCard
            icon="thumb-up"
            label={`Best day: ${insights.bestDay.date}`}
            value={`+${formatNumber(insights.bestDay.net)} ${sym}`}
            valueColor="#44FFBC"
            hint="The day with the highest net gain (income minus expenses). Only counts days that had transactions."
          />
        )}
        {insights.worstDay && (
          <InsightCard
            icon="thumb-down"
            label={`Worst day: ${insights.worstDay.date}`}
            value={`${formatNumber(insights.worstDay.net)} ${sym}`}
            valueColor="#FF5959"
            hint="The day with the lowest net result (income minus expenses). Only counts days that had transactions."
          />
        )}
        <InsightCard
          icon="scale-balance"
          label="Net result"
          value={`${data.inflows >= data.outflows ? "+" : ""}${formatNumber(data.inflows - data.outflows)} ${sym}`}
          valueColor={data.inflows >= data.outflows ? "#44FFBC" : "#FF5959"}
          hint="Total income minus total expenses for this period. Positive means you saved money."
        />
        <InsightCard
          icon="counter"
          label="Total transactions"
          value={`${insights.totalTransactions}`}
          hint="Number of income and expense transactions in this period (excludes transfers between personal accounts)."
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
  chartCard: {
    backgroundColor: colors.darkBlack,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  chartTitle: {
    color: "white",
    fontSize: size.subheadline,
    fontWeight: font.bold as any,
  },
  chartSubtitle: {
    color: colors.gray,
    fontSize: 11,
  },
  legend: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.gray,
    fontSize: size.footnote,
  },
  insights: {
    gap: 6,
  },
});
