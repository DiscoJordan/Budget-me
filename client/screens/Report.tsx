import React, { useContext, useState, useCallback, useLayoutEffect } from "react";
import { ScrollView, View, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { AccountsContext } from "../context/AccountsContext";
import { TransactionsContext } from "../context/TransactionsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { AccountingPeriodContext } from "../context/AccountingPeriodContext";
import { DebtsContext } from "../context/DebtsContext";
import PeriodNavigator from "../components/PeriodNavigator";
import ReportTabBar, { ReportTab } from "../components/report/ReportTabBar";
import AccountFilterModal from "../components/report/AccountFilterModal";
import ExpenseTab from "../components/report/ExpenseTab";
import IncomeTab from "../components/report/IncomeTab";
import OverviewTab from "../components/report/OverviewTab";
import BalanceTab from "../components/report/BalanceTab";
import { useReportData } from "../hooks/useReportData";
import { colors } from "../styles/styles";

function Report() {
  const navigation = useNavigation();
  const { accounts, loading: accountsLoading } = useContext(AccountsContext);
  const { transactions, loading: transactionsLoading } = useContext(TransactionsContext);
  const { rates, mainCurrency } = useContext(CurrencyContext);
  const { dateFrom, dateTo, periodType, offset } = useContext(AccountingPeriodContext);
  const { settings, setIncludeInPersonalBalance } = useContext(DebtsContext);

  const [activeTab, setActiveTab] = useState<ReportTab>("expense");
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [filterVisible, setFilterVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ paddingRight: 16, paddingVertical: 8 }}
          onPress={() => setFilterVisible(true)}
        >
          <Feather
            name="sliders"
            size={20}
            color={excludedIds.size > 0 ? colors.primaryGreen : "white"}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, excludedIds]);

  const toggleExclude = useCallback((id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const data = useReportData(
    transactions,
    accounts,
    dateFrom,
    dateTo,
    excludedIds,
    rates,
    mainCurrency,
    periodType,
    offset,
    settings.includeInPersonalBalance,
  );

  const renderTab = () => {
    switch (activeTab) {
      case "expense":
        return <ExpenseTab data={data} currency={mainCurrency} />;
      case "income":
        return <IncomeTab data={data} currency={mainCurrency} />;
      case "overview":
        return <OverviewTab data={data} currency={mainCurrency} />;
      case "balance":
        return (
          <BalanceTab
            data={data}
            currency={mainCurrency}
            includeDebt={settings.includeInPersonalBalance}
            onToggleDebt={setIncludeInPersonalBalance}
          />
        );
    }
  };

  return (
    <View style={styles.screen}>
      {(accountsLoading || transactionsLoading) && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
        </View>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PeriodNavigator />
        <ReportTabBar active={activeTab} onSelect={setActiveTab} />
        {renderTab()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AccountFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        accounts={accounts}
        excludedIds={excludedIds}
        onToggle={toggleExclude}
      />
    </View>
  );
}

export default Report;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    gap: 8,
  },
});
