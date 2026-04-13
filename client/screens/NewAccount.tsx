import React, { useState, useContext, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import uuid from "react-native-uuid";
import Dialog from "react-native-dialog";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { CurrencyContext } from "../context/CurrencyContext";
import { getCurrencyMeta } from "../utils/currencyInfo";
import { convertCurrency } from "../utils/convertCurrency";
import {
  container,
  h1,
  input,
  submit_button,
  submit_button_text,
  colors,
  font,
  caption1,
  subheadline,
  body,
  account,
  accounts__add,
  windowWidth,
} from "../styles/styles";
// import { URL } from "../config";
// import axios from "axios";
import { upsertAccount } from "../db/accountsDb";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import LiquidAccountTile from "../components/LiquidAccountTile";
import { Subcategory } from "../src/types";
import { TransactionsContext } from "../context/TransactionsContext";
import { parseNumber } from "../utils/parseNumber";
import GlassInput from "../components/GlassInput";

function NewAccount({ navigation, route }: { navigation: any; route?: any }) {
  const { t } = useTranslation();
  const { login, user } = useContext(UsersContext);
  const {
    getAccountsOfUser,
    accounts,
    activeAccount,
    iconColors,
    accountData,
    getRandomColor,
    setAccountData,
    randomColor,
    type,
    deleteSubAccount,
  } = useContext(AccountsContext);
  const { currencies, mainCurrency, rates } = useContext(CurrencyContext);
  const { transactions } = useContext(TransactionsContext);
  const [message, setMessage] = useState<string>("");
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [addDialogVisible, setAddDialogVisible] = useState<boolean>(false);
  const [currentSubcat, setCurrentSubcat] = useState<Subcategory | null>(null);
  const [newSubcatName, setNewSubcatName] = useState<string>("");
  const [addSubcatName, setAddSubcatName] = useState<string>("");
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  // Multi-account state
  const [isMultiAccount, setIsMultiAccount] = useState(
    activeAccount?.isMultiAccount ?? false,
  );
  // Drafts used only when creating a new multi-account
  const [subDrafts, setSubDrafts] = useState<{ currency: string; balance: number }[]>([]);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [subCurrencySearch, setSubCurrencySearch] = useState("");
  const [pendingSubCurrency, setPendingSubCurrency] = useState(mainCurrency);
  const [pendingSubBalance, setPendingSubBalance] = useState("");

  // Existing sub-accounts when editing
  const existingSubAccounts = useMemo(
    () => accounts.filter((a) => a.parentId === activeAccount?._id),
    [accounts, activeAccount],
  );

  // Auto-add first sub-draft whenever multi-account is turned on (create mode)
  useEffect(() => {
    if (isMultiAccount && type !== "edit" && subDrafts.length === 0) {
      const currency = accountData.currency || mainCurrency;
      const balance = accountData.balance ?? 0;
      setSubDrafts([{ currency, balance }]);
    }
  }, [isMultiAccount]);

  const countTransactionsForSub = (subId: string) =>
    transactions.filter(
      (t) =>
        (t.senderId as any)?._id === subId ||
        (t.recipientId as any)?._id === subId,
    ).length;

  useEffect(() => {
    if (accountData.icon) {
      setAccountData(accountData);
    } else {
      getRandomColor();
    }
    // Set default currency if not already set (new account only)
    if (!accountData.currency && type !== "edit") {
      setAccountData((prev) => ({ ...prev, currency: mainCurrency }));
    }
    // Apply forceType from navigation params (e.g. "debt" from Debts screen)
    const forceType = route?.params?.forceType;
    if (forceType && type !== "edit") {
      setAccountData((prev) => ({ ...prev, type: forceType }));
    }
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      // ─── OFFLINE-FIRST: replaced API calls with SQLite ────────────────────
      if (type !== "edit") {
        const newId = uuid.v4() as string;
        const payload = {
          ...accountData,
          _id: newId,
          ownerId: user?.id ?? "",
          isMultiAccount,
          balance: isMultiAccount ? 0 : (accountData.balance ?? 0),
          initialBalance: isMultiAccount ? 0 : (accountData.balance ?? 0),
          currency: isMultiAccount ? (subDrafts[0]?.currency ?? mainCurrency) : (accountData.currency ?? mainCurrency),
          subcategories: accountData.subcategories ?? [],
        };
        await upsertAccount(payload as any);
        if (isMultiAccount) {
          for (let i = 0; i < subDrafts.length; i++) {
            const sub = subDrafts[i];
            await upsertAccount({
              _id: uuid.v4() as string,
              ownerId: user?.id ?? "",
              icon: accountData.icon ?? { color: "#717171", icon_value: "credit-card-outline" },
              type: "personal",
              name: sub.currency,
              subcategories: [],
              balance: sub.balance,
              initialBalance: sub.balance,
              currency: sub.currency,
              parentId: newId,
              isMultiAccount: false,
              isMainSubAccount: i === 0,
            } as any);
          }
        }
        await getAccountsOfUser();
        navigation.navigate("Home", { screen: "Dashboard" });
      } else {
        await upsertAccount({
          ...accountData,
          ownerId: user?.id ?? "",
          isMultiAccount,
          initialBalance: accountData.balance ?? 0,
          subcategories: accountData.subcategories ?? [],
        } as any);
        await getAccountsOfUser();
        if (accountData.type === "debt") {
          navigation.goBack();
        } else {
          navigation.navigate("Home", { screen: "Dashboard" });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const showEditDialog = (subcat: Subcategory) => {
    setCurrentSubcat(subcat);
    setNewSubcatName(subcat.subcategory);
    setDialogVisible(true);
  };

  const handleChange = (value: string, name: string) => {
    setAccountData({ ...accountData, [name]: value });
  };

  const editAlert = () => {
    if (currentSubcat && newSubcatName.length > 0) {
      const index = accountData.subcategories
        .map((e) => e.id)
        .indexOf(currentSubcat.id);
      const newData = { ...accountData };
      newData.subcategories = [...newData.subcategories];
      newData.subcategories[index] = {
        id: currentSubcat.id,
        subcategory: newSubcatName,
      };
      setAccountData(newData);
    }
    setDialogVisible(false);
  };

  const deleteSubcat = () => {
    if (currentSubcat && newSubcatName.length > 0) {
      const newData = { ...accountData };
      newData.subcategories = newData.subcategories.filter(
        (subcat) => subcat.id !== currentSubcat.id,
      );
      setAccountData(newData);
    }
    setDialogVisible(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: container.backgroundColor }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          alignItems: "center",
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
      {accountData.type === "debt" ? (
        <>
          <View style={{ alignItems: "center", gap: 8 }}>
            <View
              style={{
                ...accounts__add,
                backgroundColor: accountData.icon.color,
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
                {(accountData.name || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ ...subheadline, color: colors.gray, fontWeight: "600" }}>
              {t("newAccount.color")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, width: "100%", paddingHorizontal: 10 }}>
            {iconColors.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setAccountData({ ...accountData, icon: { ...accountData.icon, color } })}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: color,
                  borderWidth: accountData.icon.color === color ? 4 : 0,
                  borderColor: "white",
                }}
              />
            ))}
          </View>
        </>
      ) : (
        <View style={{ ...account }}>
          <LiquidAccountTile
            iconName={accountData?.icon?.icon_value || activeAccount?.icon?.icon_value || "credit-card-outline"}
            iconColor={accountData.icon.color}
            size={80}
            onPress={() => navigation.navigate("Choose icon")}
          />
          <Text style={{ ...subheadline, color: colors.gray, fontWeight: "600" }}>
            {t("newAccount.icon")}
          </Text>
        </View>
      )}
      <GlassInput
        containerStyle={styles.inputContainer}
        onChangeText={(text) => handleChange(text, "name")}
        value={accountData?.name}
        placeholder={t("newAccount.title")}
        clearButtonMode={"while-editing"}
        maxLength={20}
      />
      {accountData.type === "personal" && !isMultiAccount && (
        <GlassInput
          containerStyle={styles.inputContainer}
          onChangeText={(text) =>
            setAccountData({ ...accountData, balance: parseNumber(text) })
          }
          value={accountData.balance ? String(accountData.balance) : ""}
          placeholder={t("newAccount.balance")}
          keyboardType="decimal-pad"
          clearButtonMode="while-editing"
        />
      )}

      {accountData.type === "personal" && type !== "edit" && (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t("newAccount.multiAccount")}</Text>
          <Switch
            value={isMultiAccount}
            onValueChange={(val) => {
              if (val) {
                Alert.alert(
                  t("newAccount.enableMultiAccount"),
                  t("newAccount.enableMultiAccountMsg"),
                  [
                    { text: t("common.cancel"), style: "destructive" },
                    {
                      text: t("common.proceed"),
                      onPress: () => setIsMultiAccount(true),
                    },
                  ],
                );
                // auto-add handled by useEffect
              } else {
                Alert.alert(
                  t("newAccount.cannotDisable"),
                  t("newAccount.cannotDisableMsg"),
                );
              }
            }}
            trackColor={{ false: colors.darkGray, true: colors.primaryGreen }}
            thumbColor="white"
          />
        </View>
      )}

      {accountData.type === "personal" && isMultiAccount && (
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>{t("newAccount.subAccounts")}</Text>

          {/* When editing: show existing sub-accounts */}
          {type === "edit" &&
            existingSubAccounts.map((sub) => (
              <View key={sub._id} style={styles.subRow}>
                <Text style={styles.subCurrency}>{getCurrencyMeta(sub.currency).symbol}</Text>
                <Text style={styles.subBalance}>
                  {sub.balance ?? 0} {getCurrencyMeta(sub.currency).symbol}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (existingSubAccounts.length === 1) {
                      Alert.alert(t("newAccount.cannotRemove"), t("newAccount.cannotRemoveMsg"));
                      return;
                    }
                    const txCount = countTransactionsForSub(sub._id);
                    Alert.alert(
                      t("newAccount.deleteSubAccount"),
                      t("newAccount.deleteSubAccountMsg", { currency: sub.currency, count: txCount }),
                      [
                        { text: t("common.cancel"), style: "cancel" },
                        {
                          text: t("common.delete"),
                          style: "destructive",
                          onPress: () => deleteSubAccount(sub._id),
                        },
                      ],
                    );
                  }}
                >
                  <Text style={styles.subDelete}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

          {/* When creating: show drafts */}
          {type !== "edit" &&
            subDrafts.map((sub, i) => (
              <View key={i} style={styles.subRow}>
                <Text style={styles.subCurrency}>{getCurrencyMeta(sub.currency).symbol}</Text>
                <Text style={styles.subBalance}>
                  {sub.balance} {getCurrencyMeta(sub.currency).symbol}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (subDrafts.length === 1) {
                      Alert.alert(t("newAccount.cannotRemove"), t("newAccount.cannotRemoveMsg"));
                      return;
                    }
                    setSubDrafts((prev) => prev.filter((_, idx) => idx !== i));
                  }}
                >
                  <Text style={styles.subDelete}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

          <TouchableOpacity
            style={styles.addSubBtn}
            onPress={() => {
              setPendingSubCurrency(mainCurrency);
              setPendingSubBalance("");
              setSubCurrencySearch("");
              setSubModalVisible(true);
            }}
          >
            <Text style={styles.addSubText}>{t("newAccount.addSubAccount")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {accountData.type !== "personal" && accountData.type !== "debt" && (
        <>
          <Text style={{ ...styles.h1, width: "100%" }}>{t("account.subcategories")}</Text>
          <ScrollView horizontal style={{ width: "100%" }}>
            {accountData?.subcategories?.map((subcat) => (
              <TouchableOpacity
                key={subcat.id || subcat._id || subcat.subcategory}
                onPress={() =>
                  showEditDialog(
                    accountData.subcategories[
                      accountData.subcategories
                        .map((e) => e.id || e._id)
                        .indexOf(subcat.id || subcat._id)
                    ],
                  )
                }
                style={styles.subcat}
              >
                <Text style={body}>
                  {subcat.subcategory.slice(0, 1).toUpperCase()}
                </Text>
                <Text style={caption1}>{subcat.subcategory}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => {
                setAddSubcatName("");
                setAddDialogVisible(true);
              }}
              style={styles.subcat}
            >
              <Text style={body}>+</Text>
              <Text style={caption1}>{t("common.add")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}
      {!(accountData.type === "personal" && isMultiAccount) && <TouchableOpacity
        onPress={() => setCurrencyModalVisible(true)}
        style={styles.currencyRow}
      >
        <Text style={{ ...subheadline, color: "white" }}>{t("newAccount.currency")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            style={{ ...subheadline, color: colors.gray, fontWeight: "600" }}
          >
            {accountData.currency || mainCurrency}{" "}
            {getCurrencyMeta(accountData.currency || mainCurrency).symbol}
          </Text>
          <Feather name="chevron-right" size={18} color={colors.gray} />
        </View>
      </TouchableOpacity>}

      </ScrollView>

      <TouchableOpacity
        style={[styles.submit_button, { margin: 16, marginTop: 0 }]}
        onPress={handleSubmit}
      >
        <Text style={styles.submit_button_text}>{t("common.save")}</Text>
      </TouchableOpacity>

      {/* Sub-account add modal */}
      <Modal
        visible={subModalVisible}
        animationType="slide"
        onRequestClose={() => setSubModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("newAccount.addSubAccountTitle")}</Text>
            <TouchableOpacity onPress={() => setSubModalVisible(false)}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <GlassInput
            containerStyle={styles.currencySearchContainer}
            placeholder={t("newAccount.searchCurrency")}
            value={subCurrencySearch}
            onChangeText={setSubCurrencySearch}
            autoCapitalize="characters"
            leftSlot={<MaterialCommunityIcons name="magnify" size={18} color={colors.gray} />}
          />
          <FlatList
            data={currencies.filter((c) => {
              const s = subCurrencySearch.toLowerCase();
              return (
                c.toLowerCase().includes(s) ||
                getCurrencyMeta(c).name.toLowerCase().includes(s)
              );
            })}
            keyExtractor={(item) => item}
            ListHeaderComponent={
              <GlassInput
                containerStyle={styles.currencySearchContainer}
                placeholder={t("newAccount.initialBalance")}
                value={pendingSubBalance}
                onChangeText={setPendingSubBalance}
                keyboardType="decimal-pad"
              />
            }
            renderItem={({ item }) => {
              const meta = getCurrencyMeta(item);
              const selected = item === pendingSubCurrency;
              return (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    selected && styles.currencyItemActive,
                  ]}
                  onPress={() => setPendingSubCurrency(item)}
                >
                  <View style={styles.currencyItemLeft}>
                    <Text style={[styles.currencyCode, selected && styles.currencyItemTextActive]}>
                      {item}
                    </Text>
                    <Text style={styles.currencyName}>{meta.name}</Text>
                  </View>
                  <View style={styles.currencyItemRight}>
                    <Text style={[styles.currencySymbol, selected && styles.currencyItemTextActive]}>
                      {meta.symbol}
                    </Text>
                    {selected && <Feather name="check" size={18} color={colors.primaryGreen} />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity
            style={[styles.submit_button, { position: "relative", bottom: 0, marginTop: 16 }]}
            onPress={async () => {
              // Prevent duplicate currencies
              const alreadyExists =
                type === "edit"
                  ? existingSubAccounts.some((s) => s.currency === pendingSubCurrency)
                  : subDrafts.some((d) => d.currency === pendingSubCurrency);
              if (alreadyExists) {
                Alert.alert(t("newAccount.duplicateCurrency"), t("newAccount.duplicateCurrencyMsg", { currency: pendingSubCurrency }));
                return;
              }

              const balance = parseNumber(pendingSubBalance);
              if (type === "edit" && activeAccount?._id) {
                // ─── OFFLINE-FIRST: replaced API call with SQLite ───────────
                await upsertAccount({
                  _id: uuid.v4() as string,
                  ownerId: user?.id ?? "",
                  icon: accountData.icon ?? { color: "#717171", icon_value: "credit-card-outline" },
                  type: "personal",
                  name: pendingSubCurrency,
                  subcategories: [],
                  balance,
                  initialBalance: balance,
                  currency: pendingSubCurrency,
                  parentId: activeAccount._id,
                  isMultiAccount: false,
                  isMainSubAccount: existingSubAccounts.length === 0,
                } as any);
                getAccountsOfUser();
              } else {
                setSubDrafts((prev) => [...prev, { currency: pendingSubCurrency, balance }]);
              }
              setSubModalVisible(false);
            }}
          >
            <Text style={styles.submit_button_text}>{t("common.add")}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("newAccount.chooseCurrency")}</Text>
            <TouchableOpacity
              onPress={() => {
                setCurrencyModalVisible(false);
                setCurrencySearch("");
              }}
            >
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <GlassInput
            containerStyle={styles.currencySearchContainer}
            placeholder={t("common.search")}
            value={currencySearch}
            onChangeText={setCurrencySearch}
            autoCapitalize="characters"
            leftSlot={<MaterialCommunityIcons name="magnify" size={18} color={colors.gray} />}
          />
          <FlatList
            data={currencies.filter((c) => {
              const s = currencySearch.toLowerCase();
              return (
                c.toLowerCase().includes(s) ||
                getCurrencyMeta(c).name.toLowerCase().includes(s)
              );
            })}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const meta = getCurrencyMeta(item);
              const selected = item === (accountData.currency || mainCurrency);
              return (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    selected && styles.currencyItemActive,
                  ]}
                  onPress={() => {
                    const newCurrency = item;
                    // For new accounts, keep the balance as-is (user enters amount in target currency)
                    // For edits, convert the existing balance to the new currency
                    let newBalance = accountData.balance;
                    if (
                      type === "edit" &&
                      accountData.balance !== undefined &&
                      accountData.balance !== 0
                    ) {
                      const oldCurrency = accountData.currency || mainCurrency;
                      if (oldCurrency !== newCurrency) {
                        newBalance =
                          Math.round(
                            convertCurrency(
                              accountData.balance,
                              oldCurrency,
                              newCurrency,
                              rates,
                            ) * 100,
                          ) / 100;
                      }
                    }

                    setAccountData({
                      ...accountData,
                      currency: newCurrency,
                      balance: newBalance,
                    });
                    setCurrencyModalVisible(false);
                    setCurrencySearch("");
                  }}
                >
                  <View style={styles.currencyItemLeft}>
                    <Text
                      style={[
                        styles.currencyCode,
                        selected && styles.currencyItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    <Text style={styles.currencyName}>{meta.name}</Text>
                  </View>
                  <View style={styles.currencyItemRight}>
                    <Text
                      style={[
                        styles.currencySymbol,
                        selected && styles.currencyItemTextActive,
                      ]}
                    >
                      {meta.symbol}
                    </Text>
                    {selected && (
                      <Feather
                        name="check"
                        size={18}
                        color={colors.primaryGreen}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>{t("transaction.editSubcategory")}</Dialog.Title>
        <Dialog.Description>{t("transaction.enterNewSubcategory")}</Dialog.Description>
        <Dialog.Input value={newSubcatName} onChangeText={setNewSubcatName} />
        <Dialog.Button label={t("common.cancel")} onPress={() => setDialogVisible(false)} />
        <Dialog.Button label={t("common.delete")} onPress={deleteSubcat} />
        <Dialog.Button label={t("common.save")} onPress={editAlert} />
      </Dialog.Container>

      <Dialog.Container visible={addDialogVisible}>
        <Dialog.Title>{t("transaction.newSubcategory")}</Dialog.Title>
        <Dialog.Description>{t("transaction.enterSubcategoryName")}</Dialog.Description>
        <Dialog.Input value={addSubcatName} onChangeText={setAddSubcatName} autoFocus />
        <Dialog.Button label={t("common.cancel")} onPress={() => setAddDialogVisible(false)} />
        <Dialog.Button
          label={t("common.add")}
          onPress={() => {
            if (addSubcatName.trim().length > 0) {
              const newData = { ...accountData };
              newData.subcategories = [
                ...newData.subcategories,
                { id: uuid.v4() as string, subcategory: addSubcatName.trim() },
              ];
              setAccountData(newData);
            }
            setAddDialogVisible(false);
          }}
        />
      </Dialog.Container>
    </View>
  );
}

const styles = StyleSheet.create({
  green: {
    color: colors.primaryGreen,
  },
  container,
  h1,
  input,
  submit_button,
  submit_button_text,
  currencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  currencySearchContainer: {
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
    alignSelf: "stretch",
  },
  currencyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  currencyItemActive: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
  },
  currencyItemLeft: {
    flex: 1,
    gap: 2,
  },
  currencyItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencyCode: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  currencyName: {
    color: colors.gray,
    fontSize: 13,
  },
  currencySymbol: {
    color: colors.gray,
    fontSize: 17,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "right" as const,
  },
  currencyItemTextActive: {
    color: colors.primaryGreen,
    fontWeight: "600" as const,
  },
  switchRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    width: "100%" as const,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  switchLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  subSection: {
    width: "100%" as const,
    gap: 8,
    paddingVertical: 8,
  },
  subSectionTitle: {
    color: colors.gray,
    fontSize: 13,
    fontWeight: "600" as const,
    paddingLeft: 4,
    marginBottom: 4,
  },
  subRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  subCurrency: {
    color: "white",
    fontSize: 15,
    fontWeight: "700" as const,
    minWidth: 44,
  },
  subBalance: {
    flex: 1,
    color: colors.gray,
    fontSize: 14,
  },
  subDelete: {
    color: colors.red,
    fontSize: 16,
    fontWeight: "700" as const,
    padding: 4,
  },
  addSubBtn: {
    paddingVertical: 12,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    borderRadius: 12,
    borderStyle: "dashed" as const,
  },
  addSubText: {
    color: colors.primaryGreen,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  subcat: {
    height: (windowWidth - 40 - 10 * 10) / 5,
    gap: 4,
    margin: 10,
    aspectRatio: 1 / 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.darkGray,
  },
});

export default NewAccount;
