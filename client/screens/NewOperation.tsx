import React, { useContext, useEffect, useMemo, useState } from "react";
import Dialog from "react-native-dialog";
import DateTimePicker from "@react-native-community/datetimepicker";
import { URL } from "../config";
import { formatNumber } from "../utils/formatNumber";
import axios from "axios";
import { UsersContext } from "../context/UsersContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AccountsContext } from "../context/AccountsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { EvilIcons } from "@expo/vector-icons";
import { getCurrencyMeta } from "../utils/currencyInfo";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  container,
  windowWidth,
  green_line,
  account,
  accounts__add,
  body,
  input,
  submit_button,
  submit_button_text,
  colors,
  font,
  caption1,
} from "../styles/styles";
import { Account, TransactionFormData } from "../src/types";

const NewOperation = ({ navigation }: { navigation: any }) => {
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
  const { rates } = useContext(CurrencyContext);

  // Sub-account selection for multi-accounts (sender)
  const subAccounts = useMemo(
    () => accounts.filter((a) => a.parentId === activeAccount?._id),
    [accounts, activeAccount],
  );
  const [selectedSubAccount, setSelectedSubAccount] = useState<typeof accounts[number] | null>(null);

  // Sub-account selection for multi-account recipient
  const recipientSubAccounts = useMemo(
    () => accounts.filter((a) => a.parentId === (recipientAccount as any)?._id),
    [accounts, recipientAccount],
  );
  const [selectedRecipientSubAccount, setSelectedRecipientSubAccount] = useState<typeof accounts[number] | null>(null);

  // Auto-select main sub-account for recipient
  useEffect(() => {
    if ((recipientAccount as any)?.isMultiAccount && recipientSubAccounts.length > 0) {
      const main = recipientSubAccounts.find((s) => s.isMainSubAccount) ?? recipientSubAccounts[0];
      setSelectedRecipientSubAccount(main);
    } else {
      setSelectedRecipientSubAccount(null);
    }
  }, [(recipientAccount as any)?._id, recipientSubAccounts.length]);

  // Auto-select main sub-account when sender changes
  useEffect(() => {
    if (activeAccount?.isMultiAccount && subAccounts.length > 0) {
      const main = subAccounts.find((s) => s.isMainSubAccount) ?? subAccounts[0];
      setSelectedSubAccount(main);
    } else {
      setSelectedSubAccount(null);
    }
  }, [activeAccount?._id, subAccounts.length]);

  // The "effective sender" for balance check, currency, and senderId
  const effectiveSender = activeAccount?.isMultiAccount
    ? selectedSubAccount
    : activeAccount;

  const senderCurrency = effectiveSender?.currency ?? activeAccount?.currency ?? "USD";
  const recipientCurrency = (recipientAccount as any)?.isMultiAccount
    ? (selectedRecipientSubAccount?.currency ?? recipientAccount?.currency ?? "USD")
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
    ? parseFloat(customRate) || autoRate
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

  useEffect(() => {
    setTransactionData({
      ...transactionData,
      recipientId: recipientAccount?._id,
    });
  }, [recipientAccount]);

  const Accounts = useMemo<Account[]>(() => [...accounts], [accounts]);

  const pickerAccounts = useMemo<Account[]>(() => {
    if (pickerTarget === "sender") {
      const senderType = activeAccount?.type ?? "personal";
      return Accounts.filter((a) => a.type === senderType && !a.archived && !a.parentId);
    }
    if (pickerTarget === "recipient") {
      if (activeAccount?.type === "income") {
        return Accounts.filter((a) => a.type === "personal" && !a.archived && !a.parentId);
      }
      if (activeAccount?.type === "personal") {
        return Accounts.filter(
          (a) => !a.archived && !a.parentId && a._id !== activeAccount._id,
        );
      }
    }
    return [];
  }, [pickerTarget, activeAccount, Accounts]);

  const handleChange = (value: string, name: keyof TransactionFormData) => {
    setTransactionData({ ...transactionData, [name]: value as any });
  };

  const handleSubmit = async () => {
    // For multi-accounts, require sub-account selection
    if (activeAccount?.isMultiAccount && !selectedSubAccount) {
      Alert.alert("Select a sub-account", "Please choose which currency slot to send from.");
      return;
    }
    if ((recipientAccount as any)?.isMultiAccount && !selectedRecipientSubAccount) {
      Alert.alert("Select a sub-account", "Please choose which currency slot to receive into.");
      return;
    }

    const senderBalance = effectiveSender?.balance ?? 0;
    if (
      (activeAccount?.type === "personal" || activeAccount?.isMultiAccount) &&
      Number(transactionData.amount) > senderBalance
    ) {
      const senderName = activeAccount.isMultiAccount
        ? `${activeAccount.name} (${selectedSubAccount?.currency})`
        : activeAccount.name;
      Alert.alert(
        "Insufficient funds",
        `Not enough balance in "${senderName}".\nAvailable: ${formatNumber(senderBalance)} ${getCurrencyMeta(effectiveSender?.currency).symbol}`,
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
      const response = await axios.post(`${URL}/transactions/addTransaction`, {
        ownerId: transactionData.ownerId,
        senderId: actualSenderId,
        recipientId: actualRecipientId,
        icon,
        comment: transactionData.comment,
        amount: transactionData.amount,
        subcategory: transactionData.subcategory,
        time: transactionData.time,
        currency: senderCurrency,
        rate: effectiveRate,
      });
      setMessage(response.data.message);
      setTimeout(() => {
        setMessage("");
      }, 2000);
      if (response.data.ok) {
        // Pass sub-account ID as sender override when needed
        setBalance(
          activeAccount?.isMultiAccount ? selectedSubAccount?._id : undefined,
          (recipientAccount as any)?.isMultiAccount ? selectedRecipientSubAccount?._id : undefined,
        );
        setRecipientAccount({});
        navigation.navigate("Home", { screen: "Dashboard" });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ backgroundColor: colors.background, width: "100%" }}
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
            <View style={account}>
              <TouchableOpacity
                onPress={() => setPickerTarget("sender")}
                style={[
                  accounts__add,
                  { backgroundColor: activeAccount?.icon?.color },
                ]}
              >
                <MaterialCommunityIcons
                  name={activeAccount?.icon?.icon_value || "wallet-outline"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
              <Text
                style={{
                  ...caption1,
                  color: colors.gray,
                  fontWeight: font.bold,
                }}
              >
                {activeAccount?.name}
              </Text>
              <Text
                style={{ ...caption1, color: "white", fontWeight: font.bold }}
              >
                {formatNumber(effectiveSender?.balance ?? activeAccount?.balance ?? 0)}{" "}
                {getCurrencyMeta(effectiveSender?.currency ?? activeAccount?.currency).symbol}
              </Text>
            </View>
            <EvilIcons name="arrow-right" size={48} color="white" />
            <View style={account}>
              <TouchableOpacity
                onPress={() => setPickerTarget("recipient")}
                style={[
                  accounts__add,
                  {
                    backgroundColor:
                      recipientAccount?.icon?.color || colors.darkGray,
                  },
                ]}
              >
                {recipientAccount?.icon ? (
                  <MaterialCommunityIcons
                    name={recipientAccount.icon.icon_value as any}
                    size={24}
                    color="white"
                  />
                ) : (
                  <FontAwesome5 name="question" size={24} color="white" />
                )}
              </TouchableOpacity>
              <Text
                style={{
                  ...caption1,
                  color: colors.gray,
                  fontWeight: font.bold,
                }}
              >
                {recipientAccount?.name || "Recipient"}
              </Text>
              <Text
                style={{ ...caption1, color: "white", fontWeight: font.bold }}
              >
                {recipientAccount?.balance != null
                  ? formatNumber(recipientAccount.balance)
                  : ""}
                {" " +
                  (getCurrencyMeta(recipientAccount?.currency).symbol || "")}
              </Text>
            </View>
          </View>

          {/* Sub-account currency selector for multi-account sender */}
          {activeAccount?.isMultiAccount && subAccounts.length > 0 && (
            <View style={styles.subAccountRow}>
              {subAccounts.map((sub) => (
                <TouchableOpacity
                  key={sub._id}
                  style={[
                    styles.subAccountChip,
                    selectedSubAccount?._id === sub._id && styles.subAccountChipActive,
                  ]}
                  onPress={() => setSelectedSubAccount(sub)}
                >
                  <Text style={[styles.subAccountChipCurrency, selectedSubAccount?._id === sub._id && styles.subAccountChipTextActive]}>
                    {getCurrencyMeta(sub.currency).symbol}
                  </Text>
                  <Text style={[styles.subAccountChipBalance, selectedSubAccount?._id === sub._id && styles.subAccountChipTextActive]}>
                    {formatNumber(sub.balance ?? 0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Sub-account currency selector for multi-account recipient */}
          {(recipientAccount as any)?.isMultiAccount && recipientSubAccounts.length > 0 && (
            <View style={styles.subAccountRow}>
              {recipientSubAccounts.map((sub) => (
                <TouchableOpacity
                  key={sub._id}
                  style={[
                    styles.subAccountChip,
                    selectedRecipientSubAccount?._id === sub._id && styles.subAccountChipActive,
                  ]}
                  onPress={() => setSelectedRecipientSubAccount(sub)}
                >
                  <Text style={[styles.subAccountChipCurrency, selectedRecipientSubAccount?._id === sub._id && styles.subAccountChipTextActive]}>
                    {getCurrencyMeta(sub.currency).symbol}
                  </Text>
                  <Text style={[styles.subAccountChipBalance, selectedRecipientSubAccount?._id === sub._id && styles.subAccountChipTextActive]}>
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
                  {pickerTarget === "sender"
                    ? "Choose sender"
                    : "Choose recipient"}
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
                                  rec.type === "personal"
                                );
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
                        <Text style={styles.pickerBalance}>
                          {formatNumber(item.balance ?? 0)} {item.currency}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
          <View style={green_line} />
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={colors.primaryGreen}
            />
            <Text style={styles.dateText}>
              {date.toLocaleDateString("en-EN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
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
          <TextInput
            style={{ ...input, width: "100%", color: "white" }}
            onChangeText={(text) => handleChange(text, "comment")}
            placeholderTextColor={colors.primaryGreen}
            placeholder="Comment*"
            textContentType="none"
            clearButtonMode="while-editing"
            maxLength={80}
            selectionColor={colors.primaryGreen}
          />
          <View style={{ width: "100%", position: "relative" }}>
            <TextInput
              style={{ ...input, width: "100%", color: "white", paddingRight: 72 }}
              onChangeText={(text) => handleChange(text, "amount")}
              value={transactionData.amount === 0 ? "" : String(transactionData.amount)}
              placeholderTextColor={colors.primaryGreen}
              placeholder="Amount*"
              keyboardType="decimal-pad"
              clearButtonMode="while-editing"
              maxLength={20}
              selectionColor={colors.primaryGreen}
            />
            {(activeAccount?.type === "personal" || activeAccount?.isMultiAccount) &&
              (effectiveSender?.balance ?? 0) > 0 && (
              <TouchableOpacity
                style={styles.allInBtn}
                onPress={() =>
                  setTransactionData((prev) => ({
                    ...prev,
                    amount: effectiveSender?.balance ?? 0,
                  }))
                }
              >
                <Text style={styles.allInText}>All in</Text>
              </TouchableOpacity>
            )}
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
                <Text style={body}> Subcategory</Text>
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
                    <Text style={caption1}>Without</Text>
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
                    <Text style={caption1}>Add</Text>
                  </TouchableOpacity>
                </ScrollView>
                <Dialog.Container visible={addSubcatDialogVisible}>
                  <Dialog.Title>New Subcategory</Dialog.Title>
                  <Dialog.Description>
                    Enter subcategory name
                  </Dialog.Description>
                  <Dialog.Input
                    value={newSubcatInput}
                    onChangeText={setNewSubcatInput}
                    autoFocus
                  />
                  <Dialog.Button
                    label="Cancel"
                    onPress={() => setAddSubcatDialogVisible(false)}
                  />
                  <Dialog.Button
                    label="Add"
                    onPress={async () => {
                      if (
                        newSubcatInput.trim().length > 0 &&
                        expenseAccount._id
                      ) {
                        await addSubcategoryToAccount(
                          expenseAccount._id,
                          newSubcatInput.trim(),
                        );
                      }
                      setAddSubcatDialogVisible(false);
                    }}
                  />
                </Dialog.Container>
              </>
            );
          })()}

          {message ? (
            <Text style={{ color: "white", marginTop: 8 }}>{message}</Text>
          ) : null}
        </View>
      </ScrollView>
      <TouchableOpacity style={{ ...submit_button }} onPress={handleSubmit}>
        <Text style={submit_button_text}>Save</Text>
      </TouchableOpacity>
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

export default NewOperation;
