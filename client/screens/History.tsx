import React, { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TransactionsContext } from "../context/TransactionsContext";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";
import { Transaction } from "../src/types";
import { CurrencyContext } from "../context/CurrencyContext";
import { AccountingPeriodContext } from "../context/AccountingPeriodContext";
import { colors, body } from "../styles/styles";
import { toMainCurrency } from "../utils/convertCurrency";
import { getLocale } from "../utils/formatDate";
import DaySection from "../components/account/DaySection";
import FlowSummary from "../components/FlowSummary";
import PeriodNavigator from "../components/PeriodNavigator";

function groupByDate(transactions: any[]): Record<string, any[]> {
  return transactions.reduce(
    (acc, t) => {
      const date = new Date(t.time).toISOString().split("T")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    },
    {} as Record<string, any[]>,
  );
}

function calcFlows(
  transactions: Transaction[],
  rates: Record<string, number>,
  mainCurrency: string,
) {
  let inflows = 0;
  let outflows = 0;
  for (const t of transactions) {
    const senderType = (t.senderId as any)?.type;
    const recipientType = (t.recipientId as any)?.type;
    const converted = toMainCurrency(
      t.amount,
      t.currency ?? "USD",
      rates,
      mainCurrency,
    );
    if (senderType === "income" && recipientType === "personal")
      inflows += converted;
    else if (senderType === "personal" && recipientType === "expense")
      outflows += converted;
  }
  return { inflows, outflows };
}

function History({ navigation }: { navigation: any }) {
  const { transactions, getTransactionsOfUser, setActiveTransaction, loading: transactionsLoading } =
    useContext(TransactionsContext);
  const { user } = useContext(UsersContext);
  const { accounts, loading: accountsLoading } = useContext(AccountsContext);
  const { rates, mainCurrency } = useContext(CurrencyContext);
  const { dateFrom, dateTo } = useContext(AccountingPeriodContext);
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  const handleTransactionPress = (transaction: Transaction) => {
    setActiveTransaction(transaction);
    navigation.navigate("Edit transaction");
  };

  useEffect(() => {
    getTransactionsOfUser();
  }, []);

  const filtered = useMemo(() => {
    if (!dateFrom && !dateTo) return transactions;
    return transactions.filter((t) => {
      const time = new Date(t.time).getTime();
      if (dateFrom && time < dateFrom.getTime()) return false;
      if (dateTo && time > dateTo.getTime()) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((t) => {
      const senderName = ((t.senderId as any)?.name ?? "").toLowerCase();
      const recipientName = ((t.recipientId as any)?.name ?? "").toLowerCase();
      const comment = (t.comment ?? "").toLowerCase();
      const amount = t.amount.toString();
      const subcategory = (t.subcategory ?? "").toLowerCase();
      const dateObj = new Date(t.time);
      const dateStr = dateObj.toLocaleDateString(getLocale(), {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const isoDate = new Date(t.time).toISOString().split("T")[0];
      return (
        senderName.includes(q) ||
        recipientName.includes(q) ||
        comment.includes(q) ||
        amount.includes(q) ||
        subcategory.includes(q) ||
        dateStr.includes(q) ||
        isoDate.includes(q)
      );
    });
  }, [filtered, search]);

  const { inflows, outflows } = calcFlows(filtered, rates, mainCurrency);

  const grouped = groupByDate(searched);
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  sortedDates.forEach((date) => {
    grouped[date].sort(
      (a: any, b: any) =>
        new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  });

  return (
    <View style={styles.screen}>
      {(accountsLoading || transactionsLoading) && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
        </View>
      )}
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.gray}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("history.searchTransactions")}
            placeholderTextColor={colors.gray}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>
        <FlowSummary
          inflows={inflows}
          outflows={outflows}
          currency={mainCurrency}
        />

        <PeriodNavigator />

        <Text style={styles.sectionTitle}>{t("history.operations")}</Text>

        {searched.length === 0 ? (
          <Text style={styles.empty}>
            {search.trim()
              ? t("history.noMatchingTransactions")
              : t("history.noTransactionsForPeriod")}
          </Text>
        ) : (
          sortedDates.map((date) => (
            <DaySection
              key={date}
              date={date}
              transactions={grouped[date]}
              currency={mainCurrency}
              rates={rates}
              mainCurrency={mainCurrency}
              accounts={accounts}
              onTransactionPress={handleTransactionPress}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlack,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 15,
    paddingVertical: 10,
  },
  empty: {
    color: colors.gray,
    ...body,
    padding: 20,
  },
});

export default History;
