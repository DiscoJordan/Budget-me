import React, { useMemo, useState, useCallback, useRef, useContext, useEffect } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent, TouchableOpacity } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, useAnimatedRef, useAnimatedReaction, scrollTo as reanimatedScrollTo } from "react-native-reanimated";
import { Transaction } from "../src/types";
import { AccountingPeriodContext, PeriodType } from "../context/AccountingPeriodContext";
import { toMainCurrency } from "../utils/convertCurrency";
import { formatNumber } from "../utils/formatNumber";
import { colors } from "../styles/styles";

interface PeriodBarChartProps {
  transactions: Transaction[];
  periodType: PeriodType;
  dateFrom: Date | null;
  dateTo: Date | null;
  barColor: string;
  currency: string;
  rates: Record<string, number>;
  mainCurrency: string;
  budget?: number;
}

interface BarItem {
  key: string;
  label: string;
  from: Date;
  to: Date;
  offset: number;
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function generateBars(periodType: PeriodType): BarItem[] {
  const bars: BarItem[] = [];
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();

  if (periodType === "week") {
    const count = 200;
    for (let i = -count; i <= count; i++) {
      const base = new Date(now);
      base.setDate(base.getDate() + i * 7);
      const from = new Date(base);
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      const to = new Date(base);
      to.setHours(23, 59, 59, 999);
      const dd = from.getDate().toString().padStart(2, "0");
      const mm = SHORT_MONTHS[from.getMonth()];
      bars.push({ key: `w${i}`, label: `${dd}${mm}`, from, to, offset: i });
    }
    return bars;
  }

  if (periodType === "month") {
    const count = 120;
    for (let i = -count; i <= count; i++) {
      const m = mo + i;
      const from = new Date(y, m, 1, 0, 0, 0, 0);
      const to = new Date(y, m + 1, 0, 23, 59, 59, 999);
      bars.push({
        key: `m${i}`,
        label: SHORT_MONTHS[from.getMonth()],
        from,
        to,
        offset: i,
      });
    }
    return bars;
  }

  if (periodType === "quarter") {
    const currentQ = Math.floor(mo / 3);
    const roman = ["I", "II", "III", "IV"];
    const count = 40;
    for (let i = -count; i <= count; i++) {
      const totalQ = y * 4 + currentQ + i;
      const qy = Math.floor(totalQ / 4);
      const q = ((totalQ % 4) + 4) % 4;
      const from = new Date(qy, q * 3, 1, 0, 0, 0, 0);
      const to = new Date(qy, q * 3 + 3, 0, 23, 59, 59, 999);
      const yy = qy.toString().slice(-2);
      bars.push({ key: `q${i}`, label: `${roman[q]}'${yy}`, from, to, offset: i });
    }
    return bars;
  }

  if (periodType === "half-year") {
    const currentH = mo < 6 ? 0 : 1;
    const count = 20;
    for (let i = -count; i <= count; i++) {
      const totalH = y * 2 + currentH + i;
      const hy = Math.floor(totalH / 2);
      const h = ((totalH % 2) + 2) % 2;
      const from = new Date(hy, h * 6, 1, 0, 0, 0, 0);
      const to = new Date(hy, h * 6 + 6, 0, 23, 59, 59, 999);
      bars.push({
        key: `h${i}`,
        label: `${h === 0 ? "H1" : "H2"}'${hy.toString().slice(-2)}`,
        from,
        to,
        offset: i,
      });
    }
    return bars;
  }

  if (periodType === "year") {
    const count = 20;
    for (let i = -count; i <= count; i++) {
      const yr = y + i;
      const from = new Date(yr, 0, 1, 0, 0, 0, 0);
      const to = new Date(yr, 12, 0, 23, 59, 59, 999);
      bars.push({ key: `y${i}`, label: yr.toString(), from, to, offset: i });
    }
    return bars;
  }

  return bars;
}

const BAR_MAX_HEIGHT = 100;
const BARS_VISIBLE = 8;
const BAR_GAP = 4;
const ANIM_CONFIG = { duration: 500, easing: Easing.out(Easing.cubic) };

// Animated bar component
const AnimatedBar = React.memo(function AnimatedBar({
  item,
  amount,
  fillHeight,
  isSelected,
  barWidth,
  barColor,
  onPress,
}: {
  item: BarItem;
  amount: number;
  fillHeight: number;
  isSelected: boolean;
  barWidth: number;
  barColor: string;
  onPress: () => void;
}) {
  const animatedHeight = useSharedValue(0);
  const animatedOpacity = useSharedValue(0.5);

  useEffect(() => {
    animatedHeight.value = withTiming(fillHeight, ANIM_CONFIG);
  }, [fillHeight]);

  useEffect(() => {
    animatedOpacity.value = withTiming(isSelected ? 1 : 0.5, { duration: 300 });
  }, [isSelected]);

  const fillStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    backgroundColor: barColor,
    opacity: animatedOpacity.value,
    width: "100%" as any,
    borderRadius: 6,
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.barColumn, { width: barWidth, marginRight: BAR_GAP }]}
      accessibilityLabel={`${item.label}: ${formatNumber(amount)}`}
    >
      <Text
        style={[
          styles.amountText,
          isSelected && styles.amountTextSelected,
        ]}
        numberOfLines={1}
      >
        {amount > 0 ? formatNumber(amount) : ""}
      </Text>
      <View style={styles.barBackground}>
        <Animated.View style={fillStyle} />
      </View>
      <Text
        style={[
          styles.labelText,
          isSelected && styles.labelTextSelected,
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
});

export default function PeriodBarChart({
  transactions,
  periodType,
  barColor,
  rates,
  mainCurrency,
  budget = 0,
}: PeriodBarChartProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);
  const { setOffset, offset: currentOffset } = useContext(AccountingPeriodContext);
  const listRef = useAnimatedRef<Animated.FlatList<BarItem>>();
  const scrollX = useSharedValue(-1); // -1 = not initialized yet
  const initialized = useRef(false);

  const bars = useMemo(() => generateBars(periodType), [periodType]);

  const selectedIndex = useMemo(() => {
    return bars.findIndex((b) => b.offset === currentOffset);
  }, [bars, currentOffset]);

  const barWidth = containerWidth > 0
    ? (containerWidth - BAR_GAP * (BARS_VISIBLE - 1)) / BARS_VISIBLE
    : 40;
  const itemWidth = barWidth + BAR_GAP;

  // On first layout, set scrollX to initial position without animation
  useEffect(() => {
    if (selectedIndex >= 0 && containerWidth > 0 && !initialized.current) {
      initialized.current = true;
      const target = Math.max(0, selectedIndex * itemWidth - (containerWidth / 2) + (itemWidth / 2));
      scrollX.value = target;
    }
  }, [containerWidth]);

  // Animate scrollX when selection changes (after initialization)
  useEffect(() => {
    if (selectedIndex >= 0 && containerWidth > 0 && initialized.current) {
      const target = Math.max(0, selectedIndex * itemWidth - (containerWidth / 2) + (itemWidth / 2));
      scrollX.value = withTiming(target, { duration: 500, easing: Easing.inOut(Easing.cubic) });
    }
  }, [selectedIndex]);

  useAnimatedReaction(
    () => scrollX.value,
    (val) => {
      if (val >= 0) {
        reanimatedScrollTo(listRef, val, 0, false);
      }
    },
  );

  const barAmounts = useMemo(() => {
    return bars.map((bar) => {
      let sum = 0;
      for (const t of transactions) {
        const time = new Date(t.time).getTime();
        if (time >= bar.from.getTime() && time <= bar.to.getTime()) {
          sum += toMainCurrency(
            t.amount ?? 0,
            t.currency ?? "USD",
            rates,
            mainCurrency,
          );
        }
      }
      return sum;
    });
  }, [bars, transactions, rates, mainCurrency]);

  const maxVisible = useMemo(() => {
    if (visibleIndices.length === 0) return 0;
    let max = 0;
    for (const i of visibleIndices) {
      if (i >= 0 && i < barAmounts.length && barAmounts[i] > max) {
        max = barAmounts[i];
      }
    }
    return max;
  }, [visibleIndices, barAmounts]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      setVisibleIndices(
        viewableItems
          .map((v) => v.index)
          .filter((i): i is number => i !== null),
      );
    },
    [],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const handleBarPress = useCallback(
    (bar: BarItem) => {
      setOffset(bar.offset);
    },
    [setOffset],
  );

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index,
    }),
    [itemWidth],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: BarItem; index: number }) => {
      const amount = barAmounts[index] ?? 0;
      const fillHeight =
        maxVisible > 0 ? (amount / maxVisible) * BAR_MAX_HEIGHT : 0;
      const isSelected = item.offset === currentOffset;

      return (
        <AnimatedBar
          item={item}
          amount={amount}
          fillHeight={fillHeight}
          isSelected={isSelected}
          barWidth={barWidth}
          barColor={barColor}
          onPress={() => handleBarPress(item)}
        />
      );
    },
    [barAmounts, maxVisible, barWidth, barColor, handleBarPress, currentOffset],
  );

  if (periodType === "all" || periodType === "custom") return null;

  const initialOffset = selectedIndex >= 0 && containerWidth > 0
    ? Math.max(0, selectedIndex * itemWidth - containerWidth / 2 + itemWidth / 2)
    : 0;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {budget > 0 && maxVisible > 0 && (
        <View
          style={[
            styles.budgetLine,
            {
              bottom:
                Math.min((budget / maxVisible) * BAR_MAX_HEIGHT, BAR_MAX_HEIGHT) + 12,
            },
          ]}
        >
          <View style={styles.budgetLineDash} />
        </View>
      )}
      <Animated.FlatList
        ref={listRef}
        data={bars}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: initialOffset, y: 0 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item: BarItem) => item.key}
        getItemLayout={containerWidth > 0 ? getItemLayout : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    minHeight: BAR_MAX_HEIGHT + 40,
  },
  barColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  amountText: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 2,
  },
  amountTextSelected: {
    color: colors.primaryGreen,
    fontWeight: "700",
  },
  barBackground: {
    width: "80%",
    height: BAR_MAX_HEIGHT,
    backgroundColor: colors.darkGray,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  labelText: {
    fontSize: 10,
    color: colors.gray,
    fontWeight: "600",
    marginTop: 2,
  },
  labelTextSelected: {
    color: colors.primaryGreen,
    fontWeight: "700",
  },
  budgetLine: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  budgetLineDash: {
    height: 1,
    backgroundColor: colors.gray,
    flex: 1,
    opacity: 0.5,
  },
});
