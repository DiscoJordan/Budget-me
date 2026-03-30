import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, font, size } from "../../styles/styles";

export type ReportTab = "expense" | "income" | "overview" | "balance";

const TAB_KEYS: ReportTab[] = ["expense", "income", "overview", "balance"];

const TAB_I18N: Record<ReportTab, string> = {
  expense: "report.expense",
  income: "report.income",
  overview: "report.overview",
  balance: "report.balance",
};

interface Props {
  active: ReportTab;
  onSelect: (tab: ReportTab) => void;
}

export default function ReportTabBar({ active, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {TAB_KEYS.map((key) => (
        <TouchableOpacity
          key={key}
          style={[styles.tab, active === key && styles.tabActive]}
          onPress={() => onSelect(key)}
        >
          <Text style={[styles.label, active === key && styles.labelActive]}>
            {t(TAB_I18N[key])}
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
