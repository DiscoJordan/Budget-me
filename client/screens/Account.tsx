import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import React, { useContext, useState, useEffect, useMemo } from "react";
import { AntDesign } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import {
  container,
  accounts__block,
  accounts__header,
  body,
  green_line,
  accounts__add,
  account,
  caption1,
  setting_option,
  subheadline,
  h1,
  input,
  blue,
  largeTitle,
  submit_button,
  submit_button_text,
  colors,
  title2,
  windowWidth,
  font,
  size,
  accounts__body,
} from "../styles/styles";
import { AccountsContext } from "../context/AccountsContext";
import { UsersContext } from "../context/UsersContext";
import { TransactionsContext } from "../context/TransactionsContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatNumber } from "../utils/formatNumber";
import { Transaction, Account as AccountType } from "../src/types";

// Extend Date with daysInMonth helper used in this screen
declare global {
  interface Date {
    daysInMonth(): number;
  }
}

// Extend Number with legacy .format() used in this screen
// (kept for backwards compat — prefer formatNumber() for new code)
declare global {
  interface Number {
    format(): string;
  }
}

const Account = ({ navigation }: { navigation: any }) => {
  const { transactions, getTransactionsOfUser } =
    useContext(TransactionsContext);

  useEffect(() => {
    getTransactionsOfUser();
  }, []);

  const { activeAccount } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);

  let transactionsOfAccount = transactions.filter(
    (transaction) =>
      (activeAccount?.type === "income" &&
        (transaction?.senderId as any)?._id === activeAccount?._id) ||
      (activeAccount?.type === "personal" &&
        ((transaction?.senderId as any)?._id === activeAccount?._id ||
          (transaction?.recipientId as any)?._id === activeAccount?._id)) ||
      (activeAccount?.type === "expense" &&
        (transaction?.recipientId as any)?._id === activeAccount?._id)
  );

  let outflows = transactionsOfAccount.reduce(
    (accumulator, transaction) =>
      (transaction.senderId as any)._id === activeAccount?._id
        ? accumulator + (transaction?.amount ?? 0)
        : accumulator + 0,
    0
  );

  let inflows = transactionsOfAccount.reduce(
    (accumulator, transaction) =>
      (transaction.recipientId as any)._id === activeAccount?._id
        ? accumulator + (transaction?.amount ?? 0)
        : accumulator + 0,
    0
  );

  let triggeredSubcategories = transactionsOfAccount.map(
    (tran) => tran.subcategory
  );

  Date.prototype.daysInMonth = function () {
    return 33 - new Date(this.getFullYear(), this.getMonth(), 33).getDate();
  };

  // Legacy Number.format() — kept to avoid changing rendering logic
  Number.prototype.format = function () {
    return formatNumber(this.valueOf());
  };

  triggeredSubcategories = [...new Set(triggeredSubcategories)];

  const transactionsByDate = (
    txns: Transaction[]
  ): Record<string, Transaction[]> => {
    return txns.reduce<Record<string, Transaction[]>>((acc, transaction) => {
      const date = new Date(transaction?.time).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {});
  };

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return date.toLocaleDateString("en-EN", options);
  }

  const groupedTransactions = transactionsByDate(transactionsOfAccount);
  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  sortedDates.forEach((date) => {
    groupedTransactions[date].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  });

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{
          minHeight: "100%",
          width: "100%",
          backgroundColor: colors.background,
        }}
      >
        {activeAccount?.type !== "personal" && (
          <View
            style={{
              ...container,
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View style={{ gap: 8, alignItems: "center" }}>
              <Text style={{ ...body, color: colors.gray }}>
                {activeAccount?.type === "income" ? "Income" : "Expense"}
              </Text>
              <Text
                style={{
                  ...largeTitle,
                  color:
                    activeAccount?.type === "income"
                      ? colors.green
                      : colors.red,
                }}
              >
                {transactionsOfAccount
                  .reduce(
                    (accumulator, transaction) =>
                      accumulator + (transaction?.amount ?? 0),
                    0
                  )
                  .format()}{" "}
                {user?.currency}
              </Text>
            </View>
            <View style={{ gap: 8, alignItems: "center" }}>
              <Text style={{ ...body, color: colors.gray }}>~A day</Text>
              <Text style={{ ...title2 }}>
                {(
                  transactionsOfAccount.reduce(
                    (accumulator, transaction) =>
                      accumulator + (transaction?.amount ?? 0),
                    0
                  ) / new Date().daysInMonth()
                ).format()}{" "}
                {user?.currency}
              </Text>
            </View>
          </View>
        )}
        {activeAccount?.type === "personal" && (
          <View style={styles.inOutFlows}>
            <View style={styles.inOutFlow}>
              <Text style={{ ...body, color: colors.gray }}>Inflows</Text>
              <Text style={{ ...title2, color: colors.green }}>
                {inflows.format()} {user?.currency}
              </Text>
            </View>
            <View style={styles.inOutFlow}>
              <Text style={{ ...body, color: colors.gray }}>Net balance</Text>
              <Text
                style={{
                  ...largeTitle,
                  color:
                    inflows - outflows === 0
                      ? "white"
                      : inflows - outflows > 0
                      ? colors.green
                      : colors.red,
                }}
              >
                {(inflows - outflows).format()} {user?.currency}
              </Text>
            </View>
            <View style={styles.inOutFlow}>
              <Text style={{ ...body, color: colors.gray }}>Outflows</Text>
              <Text style={{ ...title2, color: colors.red }}>
                {outflows.format()} {user?.currency}
              </Text>
            </View>
          </View>
        )}

        <View
          style={{
            ...container,
            justifyContent: "flex-start",
            alignItems: "flex-start",
            padding: 20,
          }}
        >
          {transactionsOfAccount.length > 0 ? (
            <>
              <Text style={body}> Subcategories</Text>
              <View>
                {triggeredSubcategories.map((subcat) => {
                  const triggeredTransactions = transactionsOfAccount.filter(
                    (tran) => tran.subcategory === subcat
                  );
                  const amountOfSubcat = triggeredTransactions.reduce(
                    (acc, tran) => acc + tran.amount,
                    0
                  );
                  const amountOfTransactions = transactionsOfAccount.reduce(
                    (acc, tran) => acc + tran.amount,
                    0
                  );
                  const lineSize = (
                    (amountOfSubcat / amountOfTransactions) *
                    100
                  ).toFixed(2);

                  return (
                    <View
                      key={subcat}
                      style={{
                        flexDirection: "column",
                        gap: 8,
                        padding: 5,
                        minWidth: "100%",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          gap: 10,
                          width: "100%",
                          alignItems: "flex-start",
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {subcat.length > 0 ? subcat : "No subcategory"}{" "}
                          {lineSize}%
                        </Text>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {amountOfSubcat.format()} {activeAccount?.currency}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: `${lineSize}%` as any,
                          backgroundColor: colors.primaryGreen,
                          height: 5,
                          borderRadius: 20,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}
          <Text style={body}> List of operations</Text>
        </View>
        {transactionsOfAccount.length > 0 ? (
          sortedDates?.map((date) => {
            return (
              <View key={date}>
                <View style={styles.day}>
                  <Text style={styles.dayText}>{formatDate(date)}</Text>
                  <Text style={styles.dayText}>
                    {groupedTransactions[date]
                      ?.reduce(
                        (accumulator, transaction) =>
                          (transaction?.senderId as any)?.type === "personal" &&
                          (transaction?.recipientId as any)?.type ===
                            "personal" &&
                          (transaction?.recipientId as any)?._id ===
                            activeAccount?._id
                            ? accumulator + (transaction?.amount ?? 0)
                            : (transaction?.senderId as any)?.type === "income"
                            ? accumulator + (transaction?.amount ?? 0)
                            : accumulator - (transaction?.amount ?? 0),
                        0
                      )
                      .format()}
                    {" " + user?.currency}
                  </Text>
                </View>

                {groupedTransactions[date]?.map((transaction) => (
                  <React.Fragment key={transaction?._id}>
                    <View style={styles.transaction}>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <View style={styles.tranIcon}>
                          <MaterialCommunityIcons
                            name={
                              ((transaction?.senderId as any)?.type ===
                              (transaction?.recipientId as any)?.type
                                ? "arrow-expand"
                                : (transaction?.senderId as any)?.type ===
                                  "personal"
                                ? (transaction?.recipientId as any)?.icon
                                    ?.icon_value
                                : (transaction?.senderId as any)?.icon
                                    ?.icon_value) as any
                            }
                            size={24}
                            color={
                              (transaction?.senderId as any)?.type ===
                              (transaction?.recipientId as any)?.type
                                ? "gray"
                                : (transaction?.senderId as any)?.icon
                                    ?.color === "#000000"
                                ? "white"
                                : (transaction?.senderId as any)?.type ===
                                  "personal"
                                ? (transaction?.recipientId as any)?.icon?.color
                                : (transaction?.senderId as any)?.icon?.color
                            }
                          />
                        </View>
                        <View style={{ gap: 9, justifyContent: "center" }}>
                          <View style={{ ...styles.tranHeader }}>
                            <Text
                              style={{
                                color: "white",
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              {(transaction?.senderId as any)?.type !==
                              (transaction?.recipientId as any)?.type
                                ? (transaction?.senderId as any)?.name
                                : (transaction?.senderId as any)?.name +
                                  " -> " +
                                  (transaction?.recipientId as any)?.name}

                              {transaction?.subcategory !== ""
                                ? ` / ${transaction?.subcategory}`
                                : null}
                            </Text>
                            <Text
                              style={{
                                color: colors.gray,
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              {(transaction?.senderId as any)?.type !==
                              (transaction?.recipientId as any)?.type
                                ? (transaction?.recipientId as any)?.name
                                : "Transfer"}
                            </Text>
                          </View>
                          {transaction?.comment.length > 0 ? (
                            <View>
                              <Text style={styles.comment}>
                                {transaction?.comment}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      <View style={{ justifyContent: "center" }}>
                        <Text
                          style={
                            (transaction.senderId as any).type === "personal" &&
                            (transaction?.recipientId as any)?.type ===
                              "personal"
                              ? {
                                  color: colors.gray,
                                  fontSize: 13,
                                  fontWeight: "600",
                                }
                              : (transaction.senderId as any).type === "income"
                              ? {
                                  color: colors.green,
                                  fontSize: 13,
                                  fontWeight: "600",
                                }
                              : {
                                  color: colors.red,
                                  fontSize: 13,
                                  fontWeight: "600",
                                }
                          }
                        >
                          {transaction?.amount.format()} {transaction?.currency}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.gray,
                        height: 1,
                        width: "90%",
                        margin: "auto",
                        opacity: 0.5,
                      }}
                    />
                  </React.Fragment>
                ))}
              </View>
            );
          })
        ) : (
          <Text style={{ color: "white", paddingLeft: 20 }}>
            No transactions for this period
          </Text>
        )}
      </ScrollView>
      {activeAccount?.type !== "expense" && (
        <TouchableOpacity
          style={{ ...submit_button }}
          onPress={() => navigation.navigate("New operation")}
        >
          <Text style={submit_button_text}>New transaction</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  day: {
    backgroundColor: "rgba(" + 0 + "," + 159 + "," + 156 + ",0.4)",
    paddingBottom: 16,
    paddingTop: 16,
    paddingLeft: 20,
    paddingRight: 20,
    minWidth: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  comment: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "600",
    maxWidth: windowWidth * 0.65,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  transaction: {
    backgroundColor: colors.background,
    paddingBottom: 16,
    paddingTop: 16,
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tranHeader: {
    color: "white",
    gap: 8,
    flexDirection: "row",
  },
  tranIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  inOutFlows: {
    ...container,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  inOutFlow: {
    backgroundColor: colors.darkBlack,
    alignItems: "center",
    padding: 16,
    width: "100%",
    borderRadius: 20,
    gap: 8,
  },
});

export default Account;
