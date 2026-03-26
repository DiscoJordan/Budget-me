import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AccountsContext } from "../context/AccountsContext";
import { DebtsContext } from "../context/DebtsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { colors, body, font, size } from "../styles/styles";
import { formatNumber } from "../utils/formatNumber";
import { getCurrencyMeta } from "../utils/currencyInfo";
import type { Account } from "../src/types";

type Tab = "owe_me" | "i_owe" | "all";

function DebtTile({
  account,
  mainCurrency,
  onPress,
}: {
  account: Account;
  mainCurrency: string;
  onPress: () => void;
}) {
  const rawBal = account.balance ?? 0;
  const bal = Math.round(rawBal * 100) / 100;
  const isPositive = bal > 0;
  const isZero = bal === 0;
  const symbol = getCurrencyMeta(account.currency ?? mainCurrency).symbol;

  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.avatar, { backgroundColor: account.icon?.color || colors.darkGray }]}>
        <Text style={styles.avatarLetter}>
          {account.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileName}>{account.name}</Text>
        {!isZero && (
          <Text style={[styles.tileHint, { color: isPositive ? colors.green : colors.red }]}>
            {isPositive ? "Owes you" : "You owe"}
          </Text>
        )}
      </View>
      <Text style={[styles.tileAmount, { color: isZero ? colors.gray : isPositive ? colors.green : colors.red }]}>
        {isPositive ? "+" : ""}{formatNumber(bal)} {symbol}
      </Text>
    </TouchableOpacity>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "owe_me", label: "Owe me" },
  { key: "i_owe", label: "I owe" },
  { key: "all", label: "All" },
];

export default function Debts({ navigation }: { navigation: any }) {
  const { accounts, setActiveAccount, setType } = useContext(AccountsContext);
  const { settings } = useContext(DebtsContext);
  const { mainCurrency } = useContext(CurrencyContext);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ paddingRight: 16 }}
          onPress={() => navigation.navigate("Edit Debts")}
        >
          <MaterialCommunityIcons name="pencil-outline" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, []);

  const debtAccounts = accounts.filter((a) => a.type === "debt" && !a.archived);

  const displayed =
    tab === "owe_me"
      ? debtAccounts.filter((a) => Math.round((a.balance ?? 0) * 100) > 0)
      : tab === "i_owe"
      ? debtAccounts.filter((a) => Math.round((a.balance ?? 0) * 100) < 0)
      : debtAccounts;

  if (!settings.enabled) {
    return (
      <View style={styles.emptyScreen}>
        <MaterialCommunityIcons name="handshake-outline" size={56} color={colors.gray} />
        <Text style={styles.emptyTitle}>Debts are disabled</Text>
        <Text style={styles.emptyHint}>
          Go to Settings → Debts to enable tracking of money you lend or borrow.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {debtAccounts.length === 0 ? (
          <View style={styles.hint}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={28}
              color={colors.gray}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.hintTitle}>How debts work</Text>
            <Text style={styles.hintText}>
              Each person you lend to or borrow from is a{" "}
              <Text style={styles.hintBold}>Debt account</Text>.
            </Text>
            <View style={styles.hintRow}>
              <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primaryGreen} />
              <Text style={styles.hintText}>
                <Text style={styles.hintBold}>Personal → Debt</Text>: you lend
                money (balance goes up, they owe you)
              </Text>
            </View>
            <View style={styles.hintRow}>
              <MaterialCommunityIcons name="arrow-left" size={16} color={colors.red} />
              <Text style={styles.hintText}>
                <Text style={styles.hintBold}>Debt → Personal</Text>: you borrow
                or receive repayment (balance goes down)
              </Text>
            </View>
            <Text style={[styles.hintText, { marginTop: 12 }]}>
              Tap <Text style={styles.hintBold}>✏</Text> (top-right) to add
              people.
            </Text>
          </View>
        ) : displayed.length === 0 ? (
          <Text style={styles.empty}>No debts in this category</Text>
        ) : (
          displayed.map((acc) => (
            <DebtTile
              key={acc._id}
              account={acc}
              mainCurrency={mainCurrency}
              onPress={() => {
                setActiveAccount(acc);
                setType("edit");
                navigation.navigate("Account", { type: "debt" });
              }}
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
  emptyScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    color: "white",
    fontSize: size.title2,
    fontWeight: font.bold,
  },
  emptyHint: {
    color: colors.gray,
    fontSize: size.body,
    textAlign: "center",
    lineHeight: 22,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.darkBlack,
    margin: 16,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.darkGray,
  },
  tabLabel: {
    color: colors.gray,
    fontSize: size.footnote,
    fontWeight: font.semibold,
  },
  tabLabelActive: {
    color: "white",
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlack,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  tileBody: {
    flex: 1,
    gap: 3,
  },
  tileName: {
    color: "white",
    fontSize: size.body,
    fontWeight: font.semibold,
  },
  tileHint: {
    fontSize: size.footnote,
    fontWeight: font.regular,
  },
  tileAmount: {
    fontSize: size.body,
    fontWeight: font.bold,
  },
  hint: {
    margin: 20,
    backgroundColor: colors.darkBlack,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  hintTitle: {
    color: "white",
    fontSize: size.body,
    fontWeight: font.bold,
    marginBottom: 4,
  },
  hintText: {
    color: colors.gray,
    fontSize: size.footnote,
    lineHeight: 20,
  },
  hintBold: {
    color: "white",
    fontWeight: font.semibold,
  },
  hintRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  empty: {
    color: colors.gray,
    ...body,
    padding: 20,
    textAlign: "center",
  },
});
