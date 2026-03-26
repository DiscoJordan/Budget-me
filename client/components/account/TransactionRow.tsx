import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, windowWidth } from "../../styles/styles";
import { Transaction } from "../../src/types";
import { getCurrencyMeta } from "../../utils/currencyInfo";

interface Props {
  transaction: Transaction;
  currency?: string;
  accounts?: { _id: string; name: string; parentId?: string }[];
  onPress?: (transaction: Transaction) => void;
}

function getIconName(transaction: Transaction): string {
  const sender = transaction.senderId as any;
  const recipient = transaction.recipientId as any;
  if (sender?.type === recipient?.type) return "arrow-expand";
  if (sender?.type === "personal") return recipient?.icon?.icon_value;
  return sender?.icon?.icon_value;
}

function getIconColor(transaction: Transaction): string {
  const sender = transaction.senderId as any;
  const recipient = transaction.recipientId as any;
  if (sender?.type === recipient?.type) return "gray";
  if (sender?.icon?.color === "#000000") return "white";
  if (sender?.type === "personal") return recipient?.icon?.color;
  return sender?.icon?.color;
}

function getAmountColor(transaction: Transaction): string {
  const sender = transaction.senderId as any;
  const recipient = transaction.recipientId as any;
  if (sender?.type === "personal" && recipient?.type === "personal")
    return colors.gray;
  if (sender?.type === "income") return colors.green;
  return colors.red;
}

function accountLabel(
  acc: any,
  accounts?: { _id: string; name: string; parentId?: string }[],
): string {
  if (!acc) return "";
  if (acc.parentId && accounts) {
    const parent = accounts.find((a) => a._id === acc.parentId);
    if (parent) {
      const symbol = getCurrencyMeta(acc.currency).symbol;
      return `${parent.name} (${symbol})`;
    }
  }
  return acc.name ?? "";
}

function getTitle(
  transaction: Transaction,
  accounts?: { _id: string; name: string; parentId?: string }[],
): string {
  const sender = transaction.senderId as any;
  return accountLabel(sender, accounts);
}

function getSubtitle(
  transaction: Transaction,
  accounts?: { _id: string; name: string; parentId?: string }[],
): string {
  const recipient = transaction.recipientId as any;
  return accountLabel(recipient, accounts);
}

export default function TransactionRow({
  transaction,
  accounts,
  onPress,
}: Props) {
  return (
    <React.Fragment>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress?.(transaction)}
        style={styles.transaction}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={styles.tranIcon}>
            <MaterialCommunityIcons
              name={getIconName(transaction) as any}
              size={24}
              color={getIconColor(transaction)}
            />
          </View>
          <View style={{ gap: 9, justifyContent: "center" }}>
            <View style={styles.tranHeader}>
              <Text style={styles.titleText}>
                {getTitle(transaction, accounts)}
                {transaction?.subcategory !== ""
                  ? ` / ${transaction?.subcategory}`
                  : null}
              </Text>
              <Text style={styles.titleText}> -{">"}</Text>
              <Text style={styles.subtitleText}>
                {getSubtitle(transaction, accounts)}
              </Text>
            </View>
            {transaction?.comment.length > 0 && (
              <View>
                <Text style={styles.comment}>{transaction?.comment}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ justifyContent: "center", alignItems: "flex-end" }}>
          <Text style={[styles.amount, { color: getAmountColor(transaction) }]}>
            {transaction?.amount.toLocaleString()}{" "}
            {getCurrencyMeta(transaction?.currency).symbol}
          </Text>
          {transaction?.rate != null && transaction.rate !== 1 && (
            <Text style={styles.convertedAmount}>
              {(transaction.amount * transaction.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
              {getCurrencyMeta((transaction.recipientId as any)?.currency).symbol}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.divider} />
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  transaction: {
    backgroundColor: colors.background,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tranHeader: {
    gap: 8,
    flexDirection: "row",
  },
  tranIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  subtitleText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "600",
  },
  amount: {
    fontSize: 13,
    fontWeight: "600",
  },
  convertedAmount: {
    fontSize: 11,
    color: colors.gray,
    fontWeight: "600",
    marginTop: 2,
  },
  comment: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "600",
    maxWidth: windowWidth * 0.65,
  },
  divider: {
    backgroundColor: colors.gray,
    height: 1,
    width: "90%",
    alignSelf: "center",
    opacity: 0.5,
  },
});
