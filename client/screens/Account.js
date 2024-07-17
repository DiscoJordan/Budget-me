import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
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
  submit_button,
  submit_button_text,
  colors,
  windowWidth,
  font,
  size,
  accounts__body,
} from "../styles/styles";
import { AccountsContext } from "../context/AccountsContext";
import { UsersContext } from "../context/UsersContext";
import { TransactionsContext } from "../context/TransactionsContext";
import { wrap } from "framer-motion";
const Account = ({ navigation }) => {
  const { transactions, getTransactionsOfUser } =
    useContext(TransactionsContext);

  useEffect(() => {
    getTransactionsOfUser();
  }, []);
  const { activeAccount } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);
  let transactionsOfAccount = transactions.filter(
    (transaction) =>
      (activeAccount.type === "income" &&
        transaction?.senderId?._id === activeAccount._id) ||
      (activeAccount.type === "personal" &&
        (transaction?.senderId?._id === activeAccount._id ||
          transaction?.recipientId?._id === activeAccount._id)) ||
      (activeAccount.type === "expense" &&
        transaction?.recipientId?._id === activeAccount._id)
  );

  const transactionsByDate = (transactionsOfAccount) => {
    return transactionsOfAccount.reduce((acc, transaction) => {
      const date = new Date(transaction?.time).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {});
  };

  // Formatting date
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return date.toLocaleDateString("en-EN", options);
  }

  const groupedTransactions = transactionsByDate(transactionsOfAccount);
  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  sortedDates.forEach((date) => {
    groupedTransactions[date].sort(
      (a, b) => new Date(b.time) - new Date(a.time)
    );
  });

  return (
    <ScrollView
      style={{ minHeight: "100%", backgroundColor: colors.background }}
    >
      <View
        style={{
          ...container,
          justifyContent: "flex-start",
          alignItems: "flex-start",
          padding: 20,
        }}
      >
        <View style={account}>
          <TouchableOpacity
            onPress={() => navigation.navigate("New operation")}
            style={[accounts__add, { backgroundColor: colors.primaryGreen }]}
          >
            <AntDesign name="pluscircleo" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ ...caption1 }}>New operation</Text>
        </View>
        <Text style={body}> List of operations</Text>
        <View style={green_line}></View>
      </View>
      {sortedDates?.map((date) => {
        return (
          <View key={date}>
            <View style={styles.day}>
              <Text style={styles.dayText}>{formatDate(date)}</Text>
              <Text style={styles.dayText}>
                {groupedTransactions[date]?.reduce(
                  (accumulator, transaction) =>
                    transaction.senderId.type === "income"
                      ? accumulator + transaction?.amount
                      : accumulator - transaction?.amount,
                  0
                )}
                 {" "+user.currency}
              </Text>
            </View>

            {groupedTransactions[date]?.map((transaction) => (
              <React.Fragment key={transaction._id}>
                <View style={styles.transaction} >
                  <View style={{ gap: 8 }}>
                    {/* operation info without amount */}
                    <View style={styles.tranHeader}>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {transaction?.senderId?.name}
                      </Text>
                      <Text
                        style={{
                          color: colors.gray,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {transaction?.recipientId?.name}
                      </Text>
                    </View>
                    <View>
                      {/* comment */}
                      {transaction.comment && (
                        <Text style={styles.comment}>
                          {transaction?.comment}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={{ justifyContent: "center" }}>
                    <Text
                      style={
                        transaction.senderId.type === "income"
                          ? {
                              color: colors.green,
                              fontSize: 13,
                              fontWeight: 600,
                            }
                          : {
                              color: colors.red,
                              fontSize: 13,
                              fontWeight: 600,
                            }
                      }
                    >
                      {transaction?.amount} {transaction?.currency}
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
                ></View>
              </React.Fragment>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  day: {
    backgroundColor: colors.primaryGreen,
    paddingBottom: 8,
    paddingTop: 8,
    paddingLeft: 20,
    paddingRight: 20,
    minWidth: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    
  },
  comment: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: '600',
    maxWidth: windowWidth * 0.65,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: "white",
  },
  transaction: {
    backgroundColor: colors.background,
    paddingBottom: 8,
    paddingTop: 8,
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
});

export default Account;
