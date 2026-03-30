import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Circle, G, Rect, Text as SvgText } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { colors, font, size } from "../../styles/styles";
import { formatNumber } from "../../utils/formatNumber";
import { getCurrencyMeta } from "../../utils/currencyInfo";
import { AccountBreakdown } from "../../hooks/useReportData";

interface Props {
  data: AccountBreakdown[];
  total: number;
  currency: string;
  label: string;
}

function DonutChart({ data, total, currency, label }: Props) {
  const radius = 80;
  const strokeWidth = 24;
  const labelRadius = radius + strokeWidth / 2 + 14;
  const svgSize = (labelRadius + 20) * 2;
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;
  const sym = getCurrencyMeta(currency).symbol;

  let accumulated = 0;
  const arcs = data.length > 0
    ? data.map((d) => {
        const pct = total > 0 ? d.amount / total : 0;
        const midAngle = (accumulated + pct / 2) * 2 * Math.PI - Math.PI / 2;
        const offset = circumference * (1 - accumulated) + circumference * 0.25;
        accumulated += pct;
        return {
          color: d.color,
          pct,
          dashArray: `${circumference * pct} ${circumference * (1 - pct)}`,
          dashOffset: offset,
          labelX: center + Math.cos(midAngle) * labelRadius,
          labelY: center + Math.sin(midAngle) * labelRadius,
          name: d.account.name,
        };
      })
    : [];

  return (
    <View style={{ alignItems: "center", paddingVertical: 8 }}>
      <Svg width={svgSize} height={svgSize}>
        {data.length === 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.darkGray}
            strokeWidth={strokeWidth}
            fill="none"
          />
        )}
        <G>
          {arcs.map((arc, i) => (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </G>
        {arcs.map((arc, i) =>
          arc.pct >= 0.06 ? (
            <SvgText
              key={`label-${i}`}
              x={arc.labelX}
              y={arc.labelY}
              fill="white"
              fontSize={9}
              fontWeight="600"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {(arc.pct * 100).toFixed(0)}%
            </SvgText>
          ) : null,
        )}
        <SvgText
          x={center}
          y={center - 14}
          fill={colors.gray}
          fontSize={10}
          fontWeight="600"
          textAnchor="middle"
        >
          {label}
        </SvgText>
        <SvgText
          x={center}
          y={center + 4}
          fill="white"
          fontSize={13}
          fontWeight="700"
          textAnchor="middle"
        >
          {formatNumber(total)}
        </SvgText>
        <SvgText
          x={center}
          y={center + 20}
          fill={colors.gray}
          fontSize={10}
          fontWeight="600"
          textAnchor="middle"
        >
          {sym}
        </SvgText>
      </Svg>
    </View>
  );
}

function HorizontalBars({ data, total, currency }: { data: AccountBreakdown[]; total: number; currency: string }) {
  const sym = getCurrencyMeta(currency).symbol;
  const maxAmount = data.length > 0 ? data[0].amount : 1;
  const chartWidth = Dimensions.get("window").width - 64;
  const barHeight = 22;
  const rowHeight = barHeight + 24;
  const leftPad = 0;
  const svgHeight = data.length * rowHeight + 8;

  return (
    <View style={{ paddingVertical: 8 }}>
      <Svg width={chartWidth} height={svgHeight}>
        {data.map((item, i) => {
          const y = i * rowHeight;
          const barW = Math.max((item.amount / maxAmount) * chartWidth * 0.85, 4);
          return (
            <G key={item.account._id}>
              {/* Background bar */}
              <Rect
                x={leftPad}
                y={y}
                width={chartWidth}
                height={barHeight}
                rx={6}
                fill={colors.darkGray}
                opacity={0.4}
              />
              {/* Filled bar */}
              <Rect
                x={leftPad}
                y={y}
                width={barW}
                height={barHeight}
                rx={6}
                fill={item.color}
              />
              {/* Amount on bar */}
              <SvgText
                x={barW > 60 ? barW - 6 : barW + 6}
                y={y + barHeight / 2 + 1}
                fill={barW > 60 ? "white" : colors.gray}
                fontSize={10}
                fontWeight="700"
                textAnchor={barW > 60 ? "end" : "start"}
                alignmentBaseline="middle"
              >
                {formatNumber(item.amount)} {sym}
              </SvgText>
              {/* Label below */}
              <SvgText
                x={leftPad + 2}
                y={y + barHeight + 14}
                fill={colors.gray}
                fontSize={11}
                fontWeight="600"
              >
                {item.account.name} · {item.percentage.toFixed(1)}%
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export default function DonutBreakdown({ data, total, currency, label }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"donut" | "bars">("donut");

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "donut" && styles.toggleActive]}
          onPress={() => setMode("donut")}
        >
          <Feather name="pie-chart" size={16} color={mode === "donut" ? "white" : colors.gray} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "bars" && styles.toggleActive]}
          onPress={() => setMode("bars")}
        >
          <Feather name="bar-chart-2" size={16} color={mode === "bars" ? "white" : colors.gray} />
        </TouchableOpacity>
      </View>

      {mode === "donut" ? (
        <>
          <DonutChart data={data} total={total} currency={currency} label={label} />
          {data.map((item) => (
            <View key={item.account._id} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.name} numberOfLines={1}>{item.account.name}</Text>
              <Text style={styles.pct}>{item.percentage.toFixed(1)}%</Text>
              <Text style={styles.amount}>
                {formatNumber(item.amount)} {getCurrencyMeta(currency).symbol}
              </Text>
            </View>
          ))}
        </>
      ) : (
        <HorizontalBars data={data} total={total} currency={currency} />
      )}

      {data.length === 0 && (
        <Text style={styles.empty}>{t("report.noDataForPeriod")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignSelf: "flex-end",
    gap: 4,
  },
  toggleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.darkBlack,
  },
  toggleActive: {
    backgroundColor: colors.darkGray,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.darkBlack,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    flex: 1,
    color: "white",
    fontSize: size.footnote,
    fontWeight: font.semibold as any,
  },
  pct: {
    color: colors.gray,
    fontSize: size.footnote,
    fontWeight: font.semibold as any,
    minWidth: 45,
    textAlign: "right",
  },
  amount: {
    color: "white",
    fontSize: size.footnote,
    fontWeight: font.bold as any,
    minWidth: 80,
    textAlign: "right",
  },
  empty: {
    color: colors.gray,
    fontSize: size.footnote,
    textAlign: "center",
    paddingVertical: 20,
  },
});
