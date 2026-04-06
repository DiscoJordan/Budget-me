import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AccountsContext } from "../context/AccountsContext";
import { AssetsContext } from "../context/AssetsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { colors, body, font, size } from "../styles/styles";
import { formatNumber } from "../utils/formatNumber";
import { getCurrencyMeta } from "../utils/currencyInfo";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import type { Account } from "../src/types";

function AssetTile({
  account,
  mainCurrency,
  onPress,
}: {
  account: Account;
  mainCurrency: string;
  onPress: () => void;
}) {
  const approxValue = account.initialBalance ?? 0;
  const symbol = getCurrencyMeta(account.currency ?? mainCurrency).symbol;

  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.avatar, { backgroundColor: account.icon?.color || colors.darkGray }]}>
        <MaterialCommunityIcons
          name={(account.icon?.icon_value as any) || "briefcase-outline"}
          size={22}
          color="white"
        />
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileName}>{account.name}</Text>
        <Text style={styles.tileHint}>{account.currency ?? mainCurrency}</Text>
      </View>
      <Text style={styles.tileAmount}>
        ~{formatNumber(approxValue)} {symbol}
      </Text>
    </TouchableOpacity>
  );
}

export default function Assets({ navigation }: { navigation: any }) {
  const { accounts, setActiveAccount, setType, loading: accountsLoading } = useContext(AccountsContext);
  const { settings } = useContext(AssetsContext);
  const { mainCurrency } = useContext(CurrencyContext);
  const { t } = useTranslation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ paddingRight: 16 }}
          onPress={() => navigation.navigate("Edit Assets")}
        >
          <MaterialCommunityIcons name="pencil-outline" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, []);

  const assetAccounts = accounts.filter((a) => a.type === "asset" && !a.archived);

  if (!settings.enabled) {
    return (
      <View style={styles.emptyScreen}>
        <MaterialCommunityIcons name="briefcase-outline" size={56} color={colors.gray} />
        <Text style={styles.emptyTitle}>{t("assets.assetsDisabled")}</Text>
        <Text style={styles.emptyHint}>{t("assets.assetsDisabledHint")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {accountsLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
        </View>
      )}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {assetAccounts.length === 0 ? (
          <View style={styles.hint}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={28}
              color={colors.gray}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.hintTitle}>{t("assets.howAssetsWork")}</Text>
            <Text style={styles.hintText}>{t("assets.eachAssetHint")}</Text>
            <View style={styles.hintRow}>
              <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primaryGreen} />
              <Text style={styles.hintText}>
                <Text style={styles.hintBold}>{t("assets.personalToAsset")}</Text>: {t("assets.buyingAsset")}
              </Text>
            </View>
            <View style={styles.hintRow}>
              <MaterialCommunityIcons name="arrow-left" size={16} color={colors.red} />
              <Text style={styles.hintText}>
                <Text style={styles.hintBold}>{t("assets.assetToPersonal")}</Text>: {t("assets.sellingAsset")}
              </Text>
            </View>
            <Text style={[styles.hintText, { marginTop: 12 }]}>
              {t("assets.tapEditHint")}
            </Text>
          </View>
        ) : (
          assetAccounts.map((acc) => (
            <AssetTile
              key={acc._id}
              account={acc}
              mainCurrency={mainCurrency}
              onPress={() => {
                setActiveAccount(acc);
                setType("edit");
                navigation.navigate("Account", { type: "asset" });
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
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
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
    color: colors.gray,
    fontSize: size.footnote,
  },
  tileAmount: {
    color: colors.primaryGreen,
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
