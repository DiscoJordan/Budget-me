import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { URL } from "../config";
import { AccountsContext } from "../context/AccountsContext";
import { UsersContext } from "../context/UsersContext";
import { AssetsContext } from "../context/AssetsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { colors, setting_option, font, size } from "../styles/styles";
import { formatNumber } from "../utils/formatNumber";
import { getCurrencyMeta } from "../utils/currencyInfo";
import { useTranslation } from "react-i18next";

const ASSET_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

export default function EditAssets({ navigation }: { navigation: any }) {
  const { accounts, getAccountsOfUser, setActiveAccount, setType } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);
  const { settings, setIncludeInPersonalBalance } = useContext(AssetsContext);
  const { mainCurrency } = useContext(CurrencyContext);
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [approxCost, setApproxCost] = useState("");
  const [adding, setAdding] = useState(false);

  const assetAccounts = accounts.filter((a) => a.type === "asset" && !a.archived);

  const pickColor = () =>
    ASSET_COLORS[Math.floor(Math.random() * ASSET_COLORS.length)];

  const handleAddAsset = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (assetAccounts.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert(t("assets.alreadyExists"), `"${trimmed}" ${t("assets.alreadyExistsMsg")}`);
      return;
    }

    try {
      await axios.post(`${URL}/accounts/addaccount`, {
        ownerId: user?.id,
        type: "asset",
        name: trimmed,
        icon: { color: pickColor(), icon_value: "briefcase-outline" },
        subcategories: [],
        initialBalance: parseFloat(approxCost) || 0,
        balance: 0,
        currency: mainCurrency,
      });
      await getAccountsOfUser();
      setName("");
      setApproxCost("");
      setAdding(false);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", t("assets.couldNotAdd"));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Toggle */}
      <View style={setting_option}>
        <Text style={styles.label}>{t("assets.includeInBalance")}</Text>
        <Switch
          value={settings.includeInPersonalBalance}
          onValueChange={setIncludeInPersonalBalance}
          trackColor={{ false: colors.darkGray, true: colors.primaryGreen }}
          thumbColor="white"
        />
      </View>

      <Text style={styles.sectionLabel}>{t("assets.yourAssets")}</Text>

      {assetAccounts.map((acc) => {
        const approxVal = acc.initialBalance ?? 0;
        const symbol = getCurrencyMeta(acc.currency ?? mainCurrency).symbol;
        return (
          <TouchableOpacity
            key={acc._id}
            style={styles.row}
            onPress={() => {
              setActiveAccount(acc);
              setType("edit");
              navigation.navigate("Add new account");
            }}
          >
            <View style={[styles.avatar, { backgroundColor: acc.icon?.color || colors.darkGray }]}>
              <MaterialCommunityIcons
                name={(acc.icon?.icon_value as any) || "briefcase-outline"}
                size={20}
                color="white"
              />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowName}>{acc.name}</Text>
              <Text style={[styles.rowBalance, { color: colors.primaryGreen }]}>
                ~{formatNumber(approxVal)} {symbol}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray} />
          </TouchableOpacity>
        );
      })}

      {/* Inline add asset */}
      {adding ? (
        <View style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            placeholder={t("assets.assetName")}
            placeholderTextColor={colors.gray}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />
          <TextInput
            style={styles.addInput}
            placeholder={t("assets.approxCost")}
            placeholderTextColor={colors.gray}
            value={approxCost}
            onChangeText={setApproxCost}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={handleAddAsset}
          />
          <View style={styles.addActions}>
            <TouchableOpacity
              style={styles.addCancel}
              onPress={() => { setAdding(false); setName(""); setApproxCost(""); }}
            >
              <Text style={styles.addCancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addConfirm, !name.trim() && { opacity: 0.4 }]}
              onPress={handleAddAsset}
              disabled={!name.trim()}
            >
              <Text style={styles.addConfirmText}>{t("common.add")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
          <MaterialCommunityIcons name="briefcase-plus-outline" size={20} color={colors.primaryGreen} />
          <Text style={styles.addBtnText}>{t("assets.addAsset")}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  label: {
    color: "white",
    fontSize: size.subheadline,
    fontWeight: font.regular,
  },
  sectionLabel: {
    color: colors.gray,
    fontSize: size.footnote,
    fontWeight: font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBlack,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    color: "white",
    fontSize: size.body,
    fontWeight: font.semibold,
  },
  rowBalance: {
    fontSize: size.footnote,
    fontWeight: font.semibold,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    borderStyle: "dashed",
  },
  addBtnText: {
    color: colors.primaryGreen,
    fontSize: size.body,
    fontWeight: font.semibold,
  },
  addForm: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.darkBlack,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  addInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "white",
    fontSize: size.body,
  },
  addActions: {
    flexDirection: "row",
    gap: 10,
  },
  addCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.darkGray,
  },
  addCancelText: {
    color: colors.gray,
    fontWeight: font.semibold,
    fontSize: size.body,
  },
  addConfirm: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryGreen,
  },
  addConfirmText: {
    color: "white",
    fontWeight: font.bold,
    fontSize: size.body,
  },
});
