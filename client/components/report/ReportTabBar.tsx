import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { colors, font, size } from "../../styles/styles";

export type ReportTab = "expense" | "income" | "overview" | "balance";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "expense", label: "Expense" },
  { key: "income", label: "Income" },
  { key: "overview", label: "Overview" },
  { key: "balance", label: "Balance" },
];

interface Props {
  active: ReportTab;
  onSelect: (tab: ReportTab) => void;
}

export default function ReportTabBar({ active, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, active === tab.key && styles.tabActive]}
          onPress={() => onSelect(tab.key)}
        >
          <Text style={[styles.label, active === tab.key && styles.labelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.darkBlack,
  },
  tabActive: {
    backgroundColor: colors.primaryGreen,
  },
  label: {
    color: colors.gray,
    fontSize: size.subheadline,
    fontWeight: font.semibold as any,
  },
  labelActive: {
    color: "white",
    fontWeight: font.bold as any,
  },
});
