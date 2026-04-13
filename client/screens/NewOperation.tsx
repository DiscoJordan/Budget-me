import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { formatDateLong } from "../utils/formatDate";
import Dialog from "react-native-dialog";
import DateTimePicker from "@react-native-community/datetimepicker";
// import { URL } from "../config";
import { formatNumber } from "../utils/formatNumber";
import { parseNumber } from "../utils/parseNumber";
// import axios from "axios";
import uuid from "react-native-uuid";
import { upsertTransaction } from "../db/transactionsDb";
import { UsersContext } from "../context/UsersContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AccountsContext } from "../context/AccountsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { FontAwesome5 } from "@expo/vector-icons";
import LiquidAccountTile from "../components/LiquidAccountTile";
import { BlurView } from "expo-blur";
import { getCurrencyMeta } from "../utils/currencyInfo";
import { toMainCurrency } from "../utils/convertCurrency";
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;
import {
  container,
  windowWidth,
  body,
  input,
  submit_button,
  submit_button_text,
  colors,
  font,
  caption1,
} from "../styles/styles";
import { Account, TransactionFormData } from "../src/types";
import GlassInput from "../components/GlassInput";

const NewOperation = ({
  navigation,
  route,
}: {
  navigation: any;
  route?: any;
}) => {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, []);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 260,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.5) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const debtMode = route?.params?.debtMode as
    | "lend"
    | "borrow"
    | "repay"
    | "repayToDebt"
    | "repayFromDebt"
    | undefined;
  const [message, setMessage] = React.useState<string>("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const {
    activeAccount,
    setActiveAccount,
    accounts,
    setBalance,
    recipientAccount,
    setRecipientAccount,
    addSubcategoryToAccount,
  } = useContext(AccountsContext);
  const [addSubcatDialogVisible, setAddSubcatDialogVisible] = useState(false);
  const [newSubcatInput, setNewSubcatInput] = useState("");
  const [pickerTarget, setPickerTarget] = useState<
    "sender" | "recipient" | null
  >(null);
  const { user } = useContext(UsersContext);
  const { rates, mainCurrency } = useContext(CurrencyContext);

  // Sub-account selection for multi-accounts (sender)
  const subAccounts = useMemo(
    () => accounts.filter((a) => a.parentId === activeAccount?._id),
    [accounts, activeAccount],
  );
  const [selectedSubAccount, setSelectedSubAccount] = useState<
    (typeof accounts)[number] | null
  >(null);

  // Sub-account selection for multi-account recipient
  const recipientSubAccounts = useMemo(
    () => accounts.filter((a) => a.parentId === (recipientAccount as any)?._id),
    [accounts, recipientAccount],
  );
  const [selectedRecipientSubAccount, setSelectedRecipientSubAccount] =
    useState<(typeof accounts)[number] | null>(null);

  // Auto-select main sub-account for recipient
  useEffect(() => {
    if (
      (recipientAccount as any)?.isMultiAccount &&
      recipientSubAccounts.length > 0
    ) {
      const main =
        recipientSubAccounts.find((s) => s.isMainSubAccount) ??
        recipientSubAccounts[0];
      setSelectedRecipientSubAccount(main);
    } else {
      setSelectedRecipientSubAccount(null);
    }
  }, [(recipientAccount as any)?._id, recipientSubAccounts.length]);

  // Auto-select main sub-account when sender changes
  useEffect(() => {
    if (activeAccount?.isMultiAccount && subAccounts.length > 0) {
      const main =
        subAccounts.find((s) => s.isMainSubAccount) ?? subAccounts[0];
      setSelectedSubAccount(main);
    } else {
      setSelectedSubAccount(null);
    }
  }, [activeAccount?._id, subAccounts.length]);

  // The "effective sender" for balance check, currency, and senderId
  const effectiveSender = activeAccount?.isMultiAccount
    ? selectedSubAccount
    : activeAccount;

  const senderCurrency =
    effectiveSender?.currency ?? activeAccount?.currency ?? "USD";
  const recipientCurrency = (recipientAccount as any)?.isMultiAccount
    ? (selectedRecipientSubAccount?.currency ??
      recipientAccount?.currency ??
      "USD")
    : (recipientAccount?.currency ?? "USD");
  const isCrossCurrency =
    recipientAccount?._id && senderCurrency !== recipientCurrency;

  const autoRate = useMemo(() => {
    if (!isCrossCurrency || !rates[senderCurrency] || !rates[recipientCurrency])
      return 1;
    return rates[recipientCurrency] / rates[senderCurrency];
  }, [isCrossCurrency, rates, senderCurrency, recipientCurrency]);

  const [customRate, setCustomRate] = useState<string>("");

  useEffect(() => {
    if (isCrossCurrency) {
      setCustomRate(autoRate.toFixed(6));
    } else {
      setCustomRate("");
    }
  }, [isCrossCurrency, autoRate]);

  const effectiveRate = isCrossCurrency
    ? parseNumber(customRate) || autoRate
    : 1;

  const [transactionData, setTransactionData] =
    React.useState<TransactionFormData>({
      ownerId: user?.id,
      senderId: activeAccount?._id,
      recipientId: recipientAccount?._id,
      comment: "",
      subcategory: "",
      amount: 0,
      time: new Date().toISOString(),
    });

  // Auto-open person picker when entering in debt mode from drag & drop
  useEffect(() => {
    if (debtMode === "lend" && !recipientAccount?._id) {
      // Personal → Debts tile: user needs to pick which person
      setPickerTarget("recipient");
    } else if (debtMode === "borrow" && !activeAccount) {
      // Debts tile → Personal: user needs to pick which person
      setPickerTarget("sender");
    } else if (
      debtMode === "borrow" &&
      activeAccount?.type === "debt" &&
      !recipientAccount?._id
    ) {
      // From person detail "Borrow" button: person is sender, pick personal account
      setPickerTarget("recipient");
    } else if (debtMode === "lend" && recipientAccount?._id && !activeAccount) {
      // From person detail "Lend" button: person is recipient, pick personal account
      setPickerTarget("sender");
    } else if (debtMode === "repay" && activeAccount?.type === "debt") {
      // From debt account "Repay" button: debt account is sender, pick personal account
      setPickerTarget("recipient");
    } else if (debtMode === "repayToDebt" && recipientAccount?._id) {
      // Repay to debt: recipient is set (debt account), pick personal account as sender
      setPickerTarget("sender");
    } else if (debtMode === "repayFromDebt" && activeAccount?.type === "debt") {
      // Repay from debt: sender is debt account, pick personal account as recipient
      setPickerTarget("recipient");
    }
  }, []);

  useEffect(() => {
    setTransactionData({
      ...transactionData,
      recipientId: recipientAccount?._id,
    });
  }, [recipientAccount]);

  const Accounts = useMemo<Account[]>(() => [...accounts], [accounts]);

  const pickerAccounts = useMemo<Account[]>(() => {
    // In debt mode, show contextual account lists
    if (
      debtMode === "lend" &&
      pickerTarget === "recipient" &&
      !recipientAccount?._id
    ) {
      // Dragged personal → debts tile: pick the person to lend to
      return Accounts.filter((a) => a.type === "debt" && !a.archived);
    }
    if (debtMode === "borrow" && pickerTarget === "sender" && !activeAccount) {
      // Dragged debts tile → personal: pick the person to borrow from
      return Accounts.filter((a) => a.type === "debt" && !a.archived);
    }
    if (
      debtMode === "repay" &&
      pickerTarget === "recipient" &&
      activeAccount?.type === "debt"
    ) {
      // Repay debt: sender is debt account, pick personal account as recipient
      return Accounts.filter(
        (a) => a.type === "personal" && !a.archived && !a.parentId,
      );
    }
    if (
      debtMode === "repayToDebt" &&
      pickerTarget === "sender" &&
      recipientAccount?._id
    ) {
      // Repay to debt: recipient is debt account, pick personal account as sender
      return Accounts.filter(
        (a) => a.type === "personal" && !a.archived && !a.parentId,
      );
    }
    if (
      debtMode === "repayFromDebt" &&
      pickerTarget === "recipient" &&
      activeAccount?.type === "debt"
    ) {
      // Repay from debt: sender is debt account, pick personal account as recipient
      return Accounts.filter(
        (a) => a.type === "personal" && !a.archived && !a.parentId,
      );
    }
    if (debtMode && pickerTarget === "sender" && recipientAccount?._id) {
      // Person detail: recipient set, pick personal account as sender
      return Accounts.filter(
        (a) => a.type === "personal" && !a.archived && !a.parentId,
      );
    }
    if (
      debtMode &&
      pickerTarget === "recipient" &&
      activeAccount?.type === "debt"
    ) {
      // Person detail "Borrow": sender is debt person, pick personal as recipient
      return Accounts.filter(
        (a) => a.type === "personal" && !a.archived && !a.parentId,
      );
    }

    if (pickerTarget === "sender") {
      const senderType = activeAccount?.type ?? "personal";
      return Accounts.filter(
        (a) => a.type === senderType && !a.archived && !a.parentId,
      );
    }
    if (pickerTarget === "recipient") {
      if (activeAccount?.type === "income") {
        return Accounts.filter(
          (a) => a.type === "personal" && !a.archived && !a.parentId,
        );
      }
      if (activeAccount?.type === "personal") {
        return Accounts.filter(
          (a) => !a.archived && !a.parentId && a._id !== activeAccount._id,
        );
      }
      if (activeAccount?.type === "debt") {
        // debt → personal: repayment / borrowing received
        return Accounts.filter(
          (a) => a.type === "personal" && !a.archived && !a.parentId,
        );
      }
    }
    return [];
  }, [pickerTarget, activeAccount, Accounts, debtMode]);

  const handleChange = (value: string, name: keyof TransactionFormData) => {
    setTransactionData({ ...transactionData, [name]: value as any });
  };

  const handleSubmit = async () => {
    // For multi-accounts, require sub-account selection
    if (activeAccount?.isMultiAccount && !selectedSubAccount) {
      Alert.alert(
        t("transaction.selectSubAccount"),
        t("transaction.chooseSendFrom"),
      );
      return;
    }
    if (
      (recipientAccount as any)?.isMultiAccount &&
      !selectedRecipientSubAccount
    ) {
      Alert.alert(
        t("transaction.selectSubAccount"),
        t("transaction.chooseReceiveInto"),
      );
      return;
    }

    const senderBalance = effectiveSender?.balance ?? 0;
    const isLendingToDebt = (recipientAccount as any)?.type === "debt";
    if (
      !isLendingToDebt &&
      (activeAccount?.type === "personal" || activeAccount?.isMultiAccount) &&
      parseNumber(transactionData.amount) > senderBalance
    ) {
      const senderName = activeAccount.isMultiAccount
        ? `${activeAccount.name} (${selectedSubAccount?.currency})`
        : activeAccount.name;
      Alert.alert(
        t("transaction.insufficientFunds"),
        t("transaction.insufficientFundsMsg", {
          name: senderName,
          amount: formatNumber(senderBalance),
          symbol: getCurrencyMeta(effectiveSender?.currency).symbol,
        }),
      );
      return;
    }

    try {
      // Use sub-account as sender/recipient when multi-account
      const actualSenderId = activeAccount?.isMultiAccount
        ? selectedSubAccount?._id
        : transactionData.senderId;
      const actualRecipientId = (recipientAccount as any)?.isMultiAccount
        ? selectedRecipientSubAccount?._id
        : transactionData.recipientId;

      const icon =
        activeAccount?.type === "income"
          ? activeAccount.icon
          : recipientAccount?.icon || activeAccount?.icon;
      // ─── OFFLINE-FIRST: replaced API call with SQLite ─────────────────────
      // const response = await axios.post(`${URL}/transactions/addTransaction`, { ... });
      await upsertTransaction({
        _id: uuid.v4() as string,
        ownerId: transactionData.ownerId ?? "",
        senderId: actualSenderId ?? "",
        recipientId: actualRecipientId ?? "",
        icon: icon ?? { color: "#717171", icon_value: "credit-card-outline" },
        comment: transactionData.comment ?? "",
        amount: parseNumber(transactionData.amount),
        subcategory:
          debtMode === "repayToDebt" || debtMode === "repayFromDebt"
            ? "__repayment__"
            : (transactionData.subcategory ?? ""),
        time: transactionData.time ?? new Date().toISOString(),
        currency: senderCurrency,
        rate: effectiveRate,
      } as any);
      setBalance(
        activeAccount?.isMultiAccount ? selectedSubAccount?._id : undefined,
        (recipientAccount as any)?.isMultiAccount
          ? selectedRecipientSubAccount?._id
          : undefined,
      );
      setRecipientAccount({});
      navigation.navigate("Home", { screen: "Dashboard" });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={sheetStyles.overlay}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={dismiss}
      />
      <Animated.View style={{ transform: [{ translateY }] }}>
        <BlurView intensity={40} tint="dark" style={sheetStyles.sheet}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={sheetStyles.handleArea}>
          <View style={sheetStyles.handle} />
        </View>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ ...container, padding: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 20,
              }}
            >
              <LiquidAccountTile
                iconName={activeAccount?.icon?.icon_value || "wallet-outline"}
                iconColor={activeAccount?.icon?.color || colors.primaryGreen}
                name={activeAccount?.name}
                balance={
                  activeAccount?.isMultiAccount
                    ? `${formatNumber(subAccounts.reduce((sum, s) => sum + toMainCurrency(s.balance ?? 0, s.currency, rates, mainCurrency), 0))} ${getCurrencyMeta(mainCurrency).symbol}`
                    : `${formatNumber(effectiveSender?.balance ?? activeAccount?.balance ?? 0)} ${getCurrencyMeta(effectiveSender?.currency ?? activeAccount?.currency).symbol}`
                }
                size={80}
                onPress={() => setPickerTarget("sender")}
              />
              <View style={sheetStyles.arrowWrap}>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="white"
                />
              </View>
              <LiquidAccountTile
                iconName={
                  recipientAccount?.icon?.icon_value || "help-circle-outline"
                }
                iconColor={recipientAccount?.icon?.color || colors.gray}
                name={recipientAccount?.name || t("transaction.recipient")}
                balance={
                  (recipientAccount as any)?.isMultiAccount
                    ? `${formatNumber(recipientSubAccounts.reduce((sum, s) => sum + toMainCurrency(s.balance ?? 0, s.currency, rates, mainCurrency), 0))} ${getCurrencyMeta(mainCurrency).symbol}`
                    : recipientAccount?.balance != null
                      ? `${formatNumber(recipientAccount.balance)} ${getCurrencyMeta(recipientAccount?.currency).symbol || ""}`
                      : undefined
                }
                size={80}
                onPress={() => setPickerTarget("recipient")}
              />
            </View>

            {/* Sub-account currency selector for multi-account sender */}
            {activeAccount?.isMultiAccount && subAccounts.length > 0 && (
              <View style={styles.subAccountRow}>
                {subAccounts.map((sub) => (
                  <TouchableOpacity
                    key={sub._id}
                    style={[
                      styles.subAccountChip,
                      selectedSubAccount?._id === sub._id &&
                        styles.subAccountChipActive,
                    ]}
                    onPress={() => setSelectedSubAccount(sub)}
                  >
                    <Text
                      style={[
                        styles.subAccountChipCurrency,
                        selectedSubAccount?._id === sub._id &&
                          styles.subAccountChipTextActive,
                      ]}
                    >
                      {getCurrencyMeta(sub.currency).symbol}
                    </Text>
                    <Text
                      style={[
                        styles.subAccountChipBalance,
                        selectedSubAccount?._id === sub._id &&
                          styles.subAccountChipTextActive,
                      ]}
                    >
                      {formatNumber(sub.balance ?? 0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Sub-account currency selector for multi-account recipient */}
            {(recipientAccount as any)?.isMultiAccount &&
              recipientSubAccounts.length > 0 && (
                <View style={styles.subAccountRow}>
                  {recipientSubAccounts.map((sub) => (
                    <TouchableOpacity
                      key={sub._id}
                      style={[
                        styles.subAccountChip,
                        selectedRecipientSubAccount?._id === sub._id &&
                          styles.subAccountChipActive,
                      ]}
                      onPress={() => setSelectedRecipientSubAccount(sub)}
                    >
                      <Text
                        style={[
                          styles.subAccountChipCurrency,
                          selectedRecipientSubAccount?._id === sub._id &&
                            styles.subAccountChipTextActive,
                        ]}
                      >
                        {getCurrencyMeta(sub.currency).symbol}
                      </Text>
                      <Text
                        style={[
                          styles.subAccountChipBalance,
                          selectedRecipientSubAccount?._id === sub._id &&
                            styles.subAccountChipTextActive,
                        ]}
                      >
                        {formatNumber(sub.balance ?? 0)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

            <Modal
              visible={pickerTarget !== null}
              transparent
              animationType="slide"
              onRequestClose={() => setPickerTarget(null)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setPickerTarget(null)}
              >
                <View style={styles.pickerSheet}>
                  <Text style={styles.pickerTitle}>
                    {debtMode === "lend" &&
                    pickerTarget === "recipient" &&
                    !recipientAccount?._id
                      ? t("transaction.selectPerson")
                      : debtMode === "borrow" &&
                          pickerTarget === "sender" &&
                          !activeAccount
                        ? t("transaction.selectPerson")
                        : debtMode === "repay" && pickerTarget === "recipient"
                          ? t("transaction.toWhichWallet")
                          : debtMode === "repayToDebt" &&
                              pickerTarget === "sender"
                            ? t("transaction.fromWhichWallet")
                            : debtMode === "repayFromDebt" &&
                                pickerTarget === "recipient"
                              ? t("transaction.toWhichWallet")
                              : debtMode && pickerTarget === "sender"
                                ? t("transaction.fromWhichWallet")
                                : debtMode && pickerTarget === "recipient"
                                  ? t("transaction.toWhichWallet")
                                  : pickerTarget === "sender"
                                    ? t("transaction.chooseSender")
                                    : t("transaction.chooseRecipient")}
                  </Text>
                  <ScrollView>
                    {pickerAccounts.map((item) => (
                      <TouchableOpacity
                        key={item._id}
                        style={styles.pickerRow}
                        onPress={() => {
                          if (pickerTarget === "sender") {
                            setActiveAccount(item);
                            const currentRecipientId = recipientAccount?._id;
                            const recipientStillValid =
                              currentRecipientId &&
                              currentRecipientId !== item._id &&
                              (() => {
                                const rec = Accounts.find(
                                  (a) => a._id === currentRecipientId,
                                );
                                if (!rec) return false;
                                if (item.type === "income")
                                  return rec.type === "personal";
                                if (item.type === "personal")
                                  return (
                                    rec.type === "expense" ||
                                    rec.type === "personal" ||
                                    rec.type === "debt"
                                  );
                                if (item.type === "debt")
                                  return rec.type === "personal";
                                return false;
                              })();
                            if (!recipientStillValid) {
                              setRecipientAccount({});
                            }
                            setTransactionData((prev) => ({
                              ...prev,
                              senderId: item._id,
                              recipientId: recipientStillValid
                                ? prev.recipientId
                                : undefined,
                              subcategory: "",
                            }));
                          } else {
                            setRecipientAccount(item);
                          }
                          setPickerTarget(null);
                        }}
                      >
                        <View
                          style={[
                            styles.pickerIcon,
                            {
                              backgroundColor:
                                item.icon?.color || colors.darkGray,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              (item.icon?.icon_value || "wallet-outline") as any
                            }
                            size={22}
                            color="white"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickerName}>{item.name}</Text>
                          {item.isMultiAccount ? (
                            (() => {
                              const subs = accounts.filter(
                                (a) => a.parentId === item._id,
                              );
                              const total = subs.reduce(
                                (sum, s) =>
                                  sum +
                                  toMainCurrency(
                                    s.balance ?? 0,
                                    s.currency,
                                    rates,
                                    mainCurrency,
                                  ),
                                0,
                              );
                              return (
                                <Text style={styles.pickerBalance}>
                                  {formatNumber(total)}{" "}
                                  {getCurrencyMeta(mainCurrency).symbol}
                                </Text>
                              );
                            })()
                          ) : (
                            <Text style={styles.pickerBalance}>
                              {formatNumber(item.balance ?? 0)} {item.currency}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color={colors.primaryGreen}
              />
              <Text style={styles.dateText}>{formatDateLong(date)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  setShowDatePicker(false);
                  if (selected) {
                    setDate(selected);
                    setTransactionData((prev) => ({
                      ...prev,
                      time: selected.toISOString(),
                    }));
                  }
                }}
              />
            )}
            <View style={sheetStyles.inputWrap}>
              <View style={{ width: "100%", position: "relative" }}>
              <GlassInput
                containerStyle={{ marginTop: 8 }}
                onChangeText={(text) => handleChange(text, "amount")}
                value={
                  transactionData.amount === 0
                    ? ""
                    : String(transactionData.amount)
                }
                placeholder={t("transaction.amount")}
                keyboardType="decimal-pad"
                clearButtonMode="while-editing"
                maxLength={20}
              />
              {(() => {
                const isRepayMode =
                  debtMode === "repayToDebt" || debtMode === "repayFromDebt";
                const debtAccount =
                  debtMode === "repayToDebt"
                    ? (recipientAccount as any)
                    : effectiveSender;
                const showButton =
                  isRepayMode && Math.abs(debtAccount?.balance ?? 0) !== 0;

                if (!showButton) return null;

                const allDebtAmount = Math.abs(debtAccount?.balance ?? 0);

                return (
                  <TouchableOpacity
                    style={styles.allInBtn}
                    onPress={() =>
                      setTransactionData((prev) => ({
                        ...prev,
                        amount: allDebtAmount,
                      }))
                    }
                  >
                    <Text style={styles.allInText}>
                      {t("transaction.allDebt")}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
              </View>
            </View>
            {isCrossCurrency && (
              <View style={styles.rateContainer}>
                <Text style={styles.rateLabel}>1 {senderCurrency} =</Text>
                <TextInput
                  style={styles.rateInput}
                  value={customRate}
                  onChangeText={setCustomRate}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  selectionColor={colors.primaryGreen}
                />
                <Text style={styles.rateLabel}>{recipientCurrency}</Text>
              </View>
            )}
            {isCrossCurrency && transactionData.amount > 0 && (
              <Text style={styles.ratePreview}>
                {formatNumber(transactionData.amount)} {senderCurrency} →{" "}
                {formatNumber(transactionData.amount * effectiveRate)}{" "}
                {recipientCurrency}
              </Text>
            )}
            {(() => {
              const isExpenseRecipient =
                activeAccount?.type === "personal" &&
                recipientAccount?.type === "expense";
              const expenseAccount =
                activeAccount?.type === "income" ||
                activeAccount?.type === "expense"
                  ? activeAccount
                  : isExpenseRecipient
                    ? recipientAccount
                    : null;
              if (!expenseAccount) return null;
              return (
                <>
                  <View style={{ height: 12 }} />
                  <Text style={body}> {t("transaction.subcategory")}</Text>
                  <ScrollView horizontal style={styles.subcats}>
                    <TouchableOpacity
                      onPress={() =>
                        setTransactionData({
                          ...transactionData,
                          subcategory: "",
                        })
                      }
                      style={{
                        ...styles.subcat,
                        opacity: transactionData.subcategory === "" ? 1 : 0.5,
                      }}
                    >
                      <Text style={body}>?</Text>
                      <Text style={caption1}>{t("common.without")}</Text>
                    </TouchableOpacity>
                    {expenseAccount.subcategories?.map((subcat) => (
                      <TouchableOpacity
                        key={subcat._id || subcat.id || subcat.subcategory}
                        onPress={() =>
                          setTransactionData({
                            ...transactionData,
                            subcategory: subcat.subcategory,
                          })
                        }
                        style={{
                          ...styles.subcat,
                          opacity:
                            transactionData.subcategory === subcat.subcategory
                              ? 1
                              : 0.5,
                        }}
                      >
                        <Text style={body}>
                          {subcat.subcategory.slice(0, 1).toUpperCase()}
                        </Text>
                        <Text style={caption1}>{subcat.subcategory}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => {
                        setNewSubcatInput("");
                        setAddSubcatDialogVisible(true);
                      }}
                      style={styles.subcat}
                    >
                      <Text style={body}>+</Text>
                      <Text style={caption1}>{t("common.add")}</Text>
                    </TouchableOpacity>
                  </ScrollView>
                  <Modal
                    visible={addSubcatDialogVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setAddSubcatDialogVisible(false)}
                  >
                    <View style={sheetStyles.dialogOverlay}>
                      <BlurView intensity={40} tint="dark" style={sheetStyles.dialogBox}>
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(7,14,26,0.75)", borderRadius: 24 }]} />
                        <Text style={sheetStyles.dialogTitle}>{t("transaction.newSubcategory")}</Text>
                        <Text style={sheetStyles.dialogDesc}>{t("transaction.enterSubcategoryName")}</Text>
                        <BlurView intensity={28} tint="dark" style={sheetStyles.glassField}>
                          <View style={[StyleSheet.absoluteFill, sheetStyles.glassFieldOverlay]} />
                          <TextInput
                            style={sheetStyles.glassInput}
                            value={newSubcatInput}
                            onChangeText={setNewSubcatInput}
                            autoFocus
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            placeholder={t("transaction.newSubcategory")}
                            selectionColor={colors.primaryGreen}
                            returnKeyType="done"
                          />
                        </BlurView>
                        <View style={sheetStyles.dialogActions}>
                          <TouchableOpacity
                            style={sheetStyles.dialogBtn}
                            onPress={() => setAddSubcatDialogVisible(false)}
                          >
                            <Text style={sheetStyles.dialogBtnText}>{t("common.cancel")}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[sheetStyles.dialogBtn, sheetStyles.dialogBtnPrimary]}
                            onPress={async () => {
                              if (newSubcatInput.trim().length > 0 && expenseAccount._id) {
                                await addSubcategoryToAccount(expenseAccount._id, newSubcatInput.trim());
                              }
                              setAddSubcatDialogVisible(false);
                            }}
                          >
                            <Text style={[sheetStyles.dialogBtnText, { color: colors.primaryGreen }]}>{t("common.add")}</Text>
                          </TouchableOpacity>
                        </View>
                      </BlurView>
                    </View>
                  </Modal>
                </>
              );
            })()}

            <GlassInput
              containerStyle={{ marginTop: 8 }}
              style={{ minHeight: 70, textAlignVertical: "top" }}
              onChangeText={(text) => handleChange(text, "comment")}
              placeholder={t("transaction.comment")}
              textContentType="none"
              clearButtonMode="while-editing"
              maxLength={200}
              multiline
              numberOfLines={3}
            />

            {message ? (
              <Text style={{ color: "white", marginTop: 8 }}>{message}</Text>
            ) : null}
          </View>
        </ScrollView>
        <TouchableOpacity style={sheetStyles.saveButton} onPress={handleSubmit}>
          <Text style={submit_button_text}>{t("common.save")}</Text>
        </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  rateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    width: "100%",
  },
  rateLabel: {
    color: colors.gray,
    fontSize: 15,
    fontWeight: "600",
  },
  rateInput: {
    color: colors.primaryGreen,
    fontSize: 15,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryGreen,
    minWidth: 80,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  ratePreview: {
    color: colors.gray,
    fontSize: 13,
    paddingHorizontal: 4,
    paddingBottom: 4,
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  pickerTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  pickerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerName: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  pickerBalance: {
    color: colors.gray,
    fontSize: 13,
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
  subcats: {},
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    width: "100%",
  },
  dateText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  subAccountRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    width: "100%",
    paddingVertical: 4,
  },
  subAccountChip: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center" as const,
    gap: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  subAccountChipActive: {
    borderColor: colors.primaryGreen,
    backgroundColor: colors.primaryGreen + "22",
  },
  subAccountChipCurrency: {
    color: "white",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  subAccountChipBalance: {
    color: colors.gray,
    fontSize: 11,
  },
  subAccountChipTextActive: {
    color: colors.primaryGreen,
  },
  allInBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  allInText: {
    color: colors.primaryGreen,
    fontSize: 14,
    fontWeight: "700",
  },
});

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: "rgba(7,14,26,0.82)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  handleArea: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  arrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  dialogBox: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 24,
    gap: 12,
  },
  dialogTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  dialogDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
  },
  dialogActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  dialogBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  dialogBtnPrimary: {
    backgroundColor: "rgba(70,241,197,0.08)",
    borderColor: "rgba(70,241,197,0.25)",
  },
  dialogBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "600",
  },
  inputWrap: {
    width: "100%",
    marginTop: 8,
  },
  simpleInput: {
    width: "100%",
    color: "white",
    fontSize: 16,
    paddingVertical: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  glassField: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginTop: 8,
  },
  glassFieldOverlay: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
  },
  glassInput: {
    color: "white",
    fontSize: 16,
    padding: 16,
    width: "100%",
  },
  saveButton: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    backgroundColor: colors.primaryGreen,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
});

export default NewOperation;
