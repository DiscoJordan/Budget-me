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
import { DebtsContext } from "../context/DebtsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import {
  colors,
  setting_option,
  font,
  size,
} from "../styles/styles";
import { formatNumber } from "../utils/formatNumber";
import { getCurrencyMeta } from "../utils/currencyInfo";

const PERSON_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

export default function EditDebts({ navigation }: { navigation: any }) {
  const {
    accounts,
    getAccountsOfUser,
    setActiveAccount,
    setType,
  } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);
  const { settings, setIncludeInPersonalBalance } = useContext(DebtsContext);
  const { mainCurrency } = useContext(CurrencyContext);

  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const debtAccounts = accounts.filter((a) => a.type === "debt" && !a.archived);

  const pickColor = () =>
    PERSON_COLORS[Math.floor(Math.random() * PERSON_COLORS.length)];

  const handleAddPerson = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (debtAccounts.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Already exists", `"${trimmed}" is already in your list.`);
      return;
    }

    try {
      await axios.post(`${URL}/accounts/addaccount`, {
        ownerId: user?.id,
        type: "debt",
        name: trimmed,
        icon: { color: pickColor(), icon_value: "account-outline" },
        subcategories: [],
        balance: 0,
        currency: mainCurrency,
      });
      await getAccountsOfUser();
      setName("");
      setAdding(false);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not add person.");
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Toggle */}
      <View style={setting_option}>
        <Text style={styles.label}>Include in personal balance</Text>
        <Switch
          value={settings.includeInPersonalBalance}
          onValueChange={setIncludeInPersonalBalance}
          trackColor={{ false: colors.darkGray, true: colors.primaryGreen }}
          thumbColor="white"
        />
      </View>

      {/* People */}
      <Text style={styles.sectionLabel}>People</Text>

      {debtAccounts.map((acc) => {
        const bal = acc.balance ?? 0;
        const isPositive = bal >= 0;
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
            <View
              style={[
                styles.avatar,
                { backgroundColor: acc.icon?.color || colors.darkGray },
              ]}
            >
              <Text style={styles.avatarLetter}>
                {acc.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowName}>{acc.name}</Text>
              {bal !== 0 && (
                <Text
                  style={[
                    styles.rowBalance,
                    { color: isPositive ? colors.green : colors.red },
                  ]}
                >
                  {isPositive ? "Owes you" : "You owe"}{" "}
                  {formatNumber(Math.abs(bal))} {symbol}
                </Text>
              )}
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.gray}
            />
          </TouchableOpacity>
        );
      })}

      {/* Inline add person */}
      {adding ? (
        <View style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            placeholder="Person name"
            placeholderTextColor={colors.gray}
            value={name}
            onChangeText={setName}
            autoFocus
            onSubmitEditing={handleAddPerson}
            returnKeyType="done"
          />
          <View style={styles.addActions}>
            <TouchableOpacity
              style={styles.addCancel}
              onPress={() => { setAdding(false); setName(""); }}
            >
              <Text style={styles.addCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addConfirm, !name.trim() && { opacity: 0.4 }]}
              onPress={handleAddPerson}
              disabled={!name.trim()}
            >
              <Text style={styles.addConfirmText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAdding(true)}
        >
          <MaterialCommunityIcons
            name="account-plus-outline"
            size={20}
            color={colors.primaryGreen}
          />
          <Text style={styles.addBtnText}>Add person</Text>
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
  avatarLetter: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
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
