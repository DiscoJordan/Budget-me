import React, { useContext, useEffect, useMemo, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { EvilIcons, FontAwesome5 } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import {
  container,
  windowWidth,
  green_line,
  account,
  accounts__add,
  body,
  input,
  submit_button_text,
  colors,
  font,
  caption1,
} from "../styles/styles";
import { TransactionsContext } from "../context/TransactionsContext";
import { AccountsContext } from "../context/AccountsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { formatNumber } from "../utils/formatNumber";
import { parseNumber } from "../utils/parseNumber";
import { Account } from "../src/types";

const EditTransaction = ({ navigation }: { navigation: any }) => {
  const { activeTransaction, updateTransaction, deleteTransaction } =
    useContext(TransactionsContext);
  const { accounts } = useContext(AccountsContext);
  const { rates } = useContext(CurrencyContext);

  const initialSender = (activeTransaction?.senderId as any)?._id
    ? (activeTransaction!.senderId as any)
    : accounts.find((a) => a._id === (activeTransaction?.senderId as any));

  const initialRecipient = (activeTransaction?.recipientId as any)?._id
    ? (activeTransaction!.recipientId as any)
    : accounts.find((a) => a._id === (activeTransaction?.recipientId as any));

  const [sender, setSender] = useState<Account | null>(initialSender ?? null);
  const [recipient, setRecipient] = useState<Account | null>(
    initialRecipient ?? null,
  );
  const [amount, setAmount] = useState(String(activeTransaction?.amount ?? ""));
  const [comment, setComment] = useState(activeTransaction?.comment ?? "");
  const [subcategory, setSubcategory] = useState(
    activeTransaction?.subcategory ?? "",
  );
  const [date, setDate] = useState(
    new Date(activeTransaction?.time ?? Date.now()),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [message, setMessage] = useState("");
  const [pickerTarget, setPickerTarget] = useState<"sender" | "recipient" | null>(null);

  const senderCurrency = sender?.currency ?? "USD";
  const recipientCurrency = recipient?.currency ?? "USD";
  const isCrossCurrency =
    sender && recipient && senderCurrency !== recipientCurrency;

  const autoRate = useMemo(() => {
    if (!isCrossCurrency || !rates[senderCurrency] || !rates[recipientCurrency])
      return 1;
    return rates[recipientCurrency] / rates[senderCurrency];
  }, [isCrossCurrency, rates, senderCurrency, recipientCurrency]);

  const [customRate, setCustomRate] = useState(
    activeTransaction?.rate != null && activeTransaction.rate !== 1
      ? String(activeTransaction.rate)
      : "",
  );

  useEffect(() => {
    if (isCrossCurrency && !customRate) {
      setCustomRate(autoRate.toFixed(6));
    }
  }, [isCrossCurrency, autoRate]);

  const effectiveRate = isCrossCurrency
    ? parseNumber(customRate) || autoRate
    : 1;

  const availableAccounts = useMemo<Account[]>(() => [...accounts], [accounts]);


  const pickerAccounts = useMemo(() => {
    if (pickerTarget === "sender") {
      const senderType = sender?.type ?? "personal";
      return availableAccounts.filter(
        (a) => a.type === senderType && !a.archived && !a.parentId,
      );
    }
    if (pickerTarget === "recipient") {
      if (sender?.type === "income") {
        return availableAccounts.filter(
          (a) => a.type === "personal" && !a.archived && !a.parentId,
        );
      }
      if (sender?.type === "personal") {
        return availableAccounts.filter(
          (a) =>
            !a.archived &&
            !a.parentId &&
            a._id !== sender._id &&
            (a.type === "expense" || a.type === "personal" || a.type === "debt"),
        );
      }
      if (sender?.type === "debt") {
        return availableAccounts.filter(
          (a) => a.type === "personal" && !a.archived && !a.parentId,
        );
      }
    }
    return [];
  }, [pickerTarget, sender, availableAccounts]);

  const showSubcategories = useMemo(() => {
    if (!sender || !recipient) return false;
    const isPersonalToPersonal =
      sender.type === "personal" && recipient.type === "personal";
    const isDebtPersonal =
      (sender.type === "debt" && recipient.type === "personal") ||
      (sender.type === "personal" && recipient.type === "debt");
    return !isPersonalToPersonal && !isDebtPersonal;
  }, [sender, recipient]);

  const handleSave = async () => {
    if (!activeTransaction || !sender || !recipient) return;
    const icon =
      sender.type === "income" ? sender.icon : (recipient.icon ?? sender.icon);

    const ok = await updateTransaction(activeTransaction._id, {
      senderId: sender._id,
      recipientId: recipient._id,
      amount: parseNumber(amount) || 0,
      rate: effectiveRate,
      comment,
      subcategory,
      time: date.toISOString(),
      icon,
      currency: senderCurrency,
    });

    if (ok) {
      navigation.goBack();
    } else {
      setMessage("Failed to save");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete transaction?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!activeTransaction) return;
          const ok = await deleteTransaction(activeTransaction._id);
          if (ok) navigation.goBack();
        },
      },
    ]);
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleDelete}>
          <MaterialCommunityIcons
            style={{ paddingRight: 20 }}
            name="delete-sweep-outline"
            size={24}
            color="white"
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, activeTransaction]);

  const subcategorySource =
    sender?.type === "personal"
      ? recipient?.subcategories
      : sender?.subcategories;

  if (!activeTransaction) {
    return (
      <View style={[container, { padding: 20 }]}>
        <Text style={{ color: "white" }}>No transaction selected</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ backgroundColor: colors.background, width: "100%" }}
      >
        <View style={{ ...container, padding: 20 }}>
          {/* Sender → Recipient row */}
          <View style={styles.accountsRow}>
            <View style={account}>
              <TouchableOpacity
                onPress={() => setPickerTarget("sender")}
                style={[
                  accounts__add,
                  { backgroundColor: sender?.icon?.color || "gray" },
                ]}
              >
                <MaterialCommunityIcons
                  name={(sender?.icon?.icon_value || "wallet-outline") as any}
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
                {sender?.name}
              </Text>
              <Text
                style={{ ...caption1, color: "white", fontWeight: font.bold }}
              >
                {formatNumber(sender?.balance ?? 0)} {senderCurrency}
              </Text>
            </View>
            <EvilIcons name="arrow-right" size={48} color="white" />
            <View style={account}>
              <TouchableOpacity
                onPress={() => setPickerTarget("recipient")}
                style={[
                  accounts__add,
                  { backgroundColor: recipient?.icon?.color || "gray" },
                ]}
              >
                {recipient?.icon ? (
                  <MaterialCommunityIcons
                    name={recipient.icon.icon_value as any}
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
                {recipient?.name || "Account"}
              </Text>
              <Text
                style={{ ...caption1, color: "white", fontWeight: font.bold }}
              >
                {recipient
                  ? `${formatNumber(recipient.balance ?? 0)} ${recipientCurrency}`
                  : ""}
              </Text>
            </View>
          </View>

          <View style={green_line} />

          {/* Date */}
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
                if (selected) setDate(selected);
              }}
            />
          )}

          {/* Comment */}
          <TextInput
            style={{ ...input, width: "100%", color: "white" }}
            value={comment}
            onChangeText={setComment}
            placeholderTextColor={colors.primaryGreen}
            placeholder="Comment"
            clearButtonMode="while-editing"
            maxLength={80}
            selectionColor={colors.primaryGreen}
          />

          {/* Amount */}
          <TextInput
            style={{ ...input, width: "100%", color: "white" }}
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={colors.primaryGreen}
            placeholder="Amount*"
            keyboardType="decimal-pad"
            clearButtonMode="while-editing"
            maxLength={20}
            selectionColor={colors.primaryGreen}
          />

          {/* Cross-currency rate */}
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
          {isCrossCurrency && parseNumber(amount) > 0 && (
            <Text style={styles.ratePreview}>
              {formatNumber(parseNumber(amount))} {senderCurrency} →{" "}
              {formatNumber(parseNumber(amount) * effectiveRate)}{" "}
              {recipientCurrency}
            </Text>
          )}

          {/* Subcategory */}
          {showSubcategories && (
            <>
              <Text style={body}> Subcategory</Text>
              <ScrollView horizontal style={styles.subcats}>
                <TouchableOpacity
                  onPress={() => setSubcategory("")}
                  style={[styles.subcat, { opacity: subcategory === "" ? 1 : 0.5 }]}
                >
                  <Text style={body}>?</Text>
                  <Text style={caption1}>Without</Text>
                </TouchableOpacity>
                {subcategorySource?.map((subcat) => (
                  <TouchableOpacity
                    key={subcat._id || subcat.id || subcat.subcategory}
                    onPress={() => setSubcategory(subcat.subcategory)}
                    style={[
                      styles.subcat,
                      { opacity: subcategory === subcat.subcategory ? 1 : 0.5 },
                    ]}
                  >
                    <Text style={body}>
                      {subcat.subcategory.slice(0, 1).toUpperCase()}
                    </Text>
                    <Text style={caption1}>{subcat.subcategory}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Account picker modal */}
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
                  {pickerTarget === "sender" ? "Choose sender" : "Choose recipient"}
                </Text>
                <ScrollView>
                  {pickerAccounts.map((item) => (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.pickerRow}
                      onPress={() => {
                        if (pickerTarget === "sender") {
                          setSender(item);
                          // Check if current recipient is still valid for new sender
                          if (recipient) {
                            const valid =
                              recipient._id !== item._id &&
                              ((item.type === "income" && recipient.type === "personal") ||
                                (item.type === "personal" &&
                                  (recipient.type === "expense" ||
                                    recipient.type === "personal" ||
                                    recipient.type === "debt")) ||
                                (item.type === "debt" && recipient.type === "personal"));
                            if (!valid) setRecipient(null);
                          }
                          setSubcategory("");
                        } else {
                          setRecipient(item);
                          setSubcategory("");
                        }
                        setPickerTarget(null);
                      }}
                    >
                      <View
                        style={[
                          styles.pickerIcon,
                          { backgroundColor: item.icon?.color || colors.darkGray },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={(item.icon?.icon_value || "wallet-outline") as any}
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

          {message ? (
            <Text style={{ color: colors.red, marginTop: 8 }}>{message}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={submit_button_text}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  accountsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
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
  subcat: {
    height: (windowWidth - 40 - 10 * 10) / 5,
    gap: 4,
    margin: 10,
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.darkGray,
  },
  subcats: {},
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
  bottomRow: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    gap: 8,
    padding: 12,
    backgroundColor: colors.background,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primaryGreen,
    alignItems: "center" as const,
    padding: 16,
    borderRadius: 20,
  },
});

export default EditTransaction;
