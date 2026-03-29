import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect, ClipPath } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

function BalanceLineChart({ points }: { points: ReportData["balanceLine"] }) {
  const chartWidth = screenWidth - 72;
  const chartHeight = 180;
  const topPad = 20;
  const bottomPad = 28;
  const leftPad = 48;
  const rightPad = 8;
  const drawW = chartWidth - leftPad - rightPad;
  const drawH = chartHeight - topPad - bottomPad;

  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const padded = range * 0.1;
  const yMin = minVal - padded;
  const yMax = maxVal + padded;
  const yRange = yMax - yMin;

  const toX = (i: number) => leftPad + (i / (points.length - 1)) * drawW;
  const toY = (v: number) => topPad + drawH - ((v - yMin) / yRange) * drawH;

  // Line path
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`)
    .join(" ");

  // Area path (close to bottom)
  const areaPath = linePath +
    ` L${toX(points.length - 1).toFixed(1)},${(topPad + drawH).toFixed(1)}` +
    ` L${toX(0).toFixed(1)},${(topPad + drawH).toFixed(1)} Z`;

  // Y axis labels (5 levels)
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const val = yMin + yRange * pct;
    return { y: toY(val), label: formatNumber(Math.round(val)) };
  });

  // X axis labels (~5)
  const labelInterval = Math.max(1, Math.floor(points.length / 5));
  const xLabels = points
    .map((p, i) => ({ x: toX(i), label: p.date.slice(5), show: i % labelInterval === 0 || i === points.length - 1 }))
    .filter((l) => l.show);

  return (
    <Svg width={chartWidth} height={chartHeight}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.primaryGreen} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={colors.primaryGreen} stopOpacity="0" />
        </LinearGradient>
        <ClipPath id="chartClip">
          <Rect x={leftPad} y={topPad} width={drawW} height={drawH} />
        </ClipPath>
      </Defs>

      {/* Grid lines + Y labels */}
      {yLabels.map((yl, i) => (
        <React.Fragment key={i}>
          <Line
            x1={leftPad}
            y1={yl.y}
            x2={chartWidth - rightPad}
            y2={yl.y}
            stroke={colors.darkGray}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
          <SvgText
            x={leftPad - 6}
            y={yl.y + 3}
            fill={colors.gray}
            fontSize={9}
            textAnchor="end"
          >
            {yl.label}
          </SvgText>
        </React.Fragment>
      ))}

      {/* X labels */}
      {xLabels.map((xl, i) => (
        <SvgText
          key={i}
          x={xl.x}
          y={chartHeight - 4}
          fill={colors.gray}
          fontSize={9}
          textAnchor="middle"
        >
          {xl.label}
        </SvgText>
      ))}

      {/* Area fill */}
      <Path d={areaPath} fill="url(#areaGrad)" clipPath="url(#chartClip)" />

      {/* Line */}
      <Path
        d={linePath}
        stroke={colors.primaryGreen}
        strokeWidth={2}
        fill="none"
        clipPath="url(#chartClip)"
      />
    </Svg>
  );
}

export default function BalanceTab({ data, currency }: Props) {
  const sym = getCurrencyMeta(currency).symbol;
  const { balanceLine, accountBalances } = data;

  const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0);
  const startVal = balanceLine.length > 0 ? balanceLine[0].value : 0;
  const endVal = balanceLine.length > 0 ? balanceLine[balanceLine.length - 1].value : 0;
  const balanceChange = endVal - startVal;

  return (
    <View style={styles.container}>
      {balanceLine.length > 1 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Balance trend</Text>
          <Text style={styles.chartSubtitle}>
            Running total of personal account balances over time
          </Text>
          <View style={{ alignItems: "center" }}>
            <BalanceLineChart points={balanceLine} />
          </View>
        </View>
      )}

      <View style={styles.insights}>
        <InsightCard
          icon="wallet"
          label="Total balance"
          value={`${formatNumber(totalBalance)} ${sym}`}
          hint="Sum of all personal account balances converted to your main currency."
        />
        <InsightCard
          icon="swap-vertical"
          label="Period change"
          value={`${balanceChange >= 0 ? "+" : ""}${formatNumber(balanceChange)} ${sym}`}
          valueColor={balanceChange >= 0 ? "#44FFBC" : "#FF5959"}
          hint="How your total balance changed from the start to the end of this period."
        />
      </View>

      <Text style={styles.sectionTitle}>Accounts</Text>
      {accountBalances.map(({ account, balance }) => (
        <View key={account._id} style={styles.accRow}>
          <View style={styles.accLeft}>
            <View
              style={[
                styles.accIcon,
                { backgroundColor: account.icon?.color || colors.darkGray },
              ]}
            >
              <MaterialCommunityIcons
                name={(account.icon?.icon_value || "wallet-outline") as any}
                size={18}
                color="white"
              />
            </View>
            <View>
              <Text style={styles.accName}>{account.name}</Text>
              <Text style={styles.accCurrency}>{account.currency}</Text>
            </View>
          </View>
          <Text style={[styles.accBalance, balance < 0 && { color: "#FF5959" }]}>
            {formatNumber(balance)} {sym}
          </Text>
        </View>
      ))}

      {accountBalances.length === 0 && (
        <Text style={styles.empty}>No personal accounts</Text>
      )}
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
  insights: {
    gap: 6,
  },
  sectionTitle: {
    color: "white",
    fontSize: size.body,
    fontWeight: font.bold as any,
    marginTop: 4,
  },
  accRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.darkBlack,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  accIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  accName: {
    color: "white",
    fontSize: size.footnote,
    fontWeight: font.semibold as any,
  },
  accCurrency: {
    color: colors.gray,
    fontSize: 11,
  },
  accBalance: {
    color: "white",
    fontSize: size.footnote,
    fontWeight: font.bold as any,
  },
  empty: {
    color: colors.gray,
    fontSize: size.footnote,
    textAlign: "center",
    paddingVertical: 20,
  },
});
