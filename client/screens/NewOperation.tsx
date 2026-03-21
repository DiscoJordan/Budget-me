import React, { useContext, useEffect, useMemo } from "react";
import { URL } from "../config";
import { formatNumber } from "../utils/formatNumber";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { UsersContext } from "../context/UsersContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AccountsContext } from "../context/AccountsContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { EvilIcons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  container,
  windowWidth,
  green_line,
  account,
  accounts__add,
  accounts__body,
  accounts__block,
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
  const {
    activeAccount,
    accounts,
    setBalance,
    recipientAccount,
    setRecipientAccount,
    createSubcatAlert,
  } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);

  const [transactionData, setTransactionData] =
    React.useState<TransactionFormData>({
      ownerId: user?.id,
      senderId: activeAccount?._id,
      recipientId: recipientAccount?._id,
      comment: "",
      subcategory: "",
      amount: 0,
    });

  useEffect(() => {
    setTransactionData({
      ...transactionData,
      recipientId: recipientAccount?._id,
    });
  }, [recipientAccount]);

  const Accounts = useMemo<Account[]>(() => [...accounts], [accounts]);

  const renderItem = ({ item }: { item: Account }) => {
    return <Item item={item} />;
  };

  const handleChange = (value: string, name: keyof TransactionFormData) => {
    setTransactionData({ ...transactionData, [name]: value as any });
  };

  const handleSubmit = async () => {
    try {
      const icon =
        activeAccount?.type === "income"
          ? activeAccount.icon
          : recipientAccount?.icon || activeAccount?.icon;
      const response = await axios.post(`${URL}/transactions/addTransaction`, {
        ownerId: transactionData.ownerId,
        senderId: transactionData.senderId,
        recipientId: transactionData.recipientId,
        icon,
        comment: transactionData.comment,
        amount: transactionData.amount,
        subcategory: transactionData.subcategory,
      });
      setMessage(response.data.message);
      setTimeout(() => {
        setMessage("");
      }, 2000);
      if (response.data.ok) {
        setBalance();
        setRecipientAccount({});
        navigation.navigate("Home", { screen: "Dashboard" });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const Item = ({ item }: { item: Account }) => (
    <View style={account}>
      <TouchableOpacity
        onPress={() => setRecipientAccount(item)}
        style={[accounts__add, { backgroundColor: item.icon?.color || "gray" }]}
      >
        <MaterialCommunityIcons
          name={(item.icon?.icon_value || "wallet-outline") as any}
          size={24}
          color="white"
        />
      </TouchableOpacity>
      <Text style={{ ...caption1, color: colors.gray, fontWeight: font.bold }}>
        {item.name}
      </Text>
      <Text style={{ ...caption1, color: "white", fontWeight: font.bold }}>
        {formatNumber(item.balance)} {item.currency}
      </Text>
    </View>
  );

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
                style={[
                  accounts__add,
                  { backgroundColor: activeAccount?.icon?.color },
                ]}
              >
                <MaterialCommunityIcons
                  name={(activeAccount?.icon?.icon_value || "wallet-outline") as any}
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
                {formatNumber(activeAccount?.balance ?? 0)}{" "}
                {activeAccount?.currency}
              </Text>
            </View>
            <EvilIcons name="arrow-right" size={48} color="white" />
            <View style={account}>
              <TouchableOpacity
                style={[
                  accounts__add,
                  {
                    backgroundColor:
                      recipientAccount?.icon?.color || "gray",
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
                {recipientAccount?.name || "Account"}
              </Text>
              <Text
                style={{ ...caption1, color: "white", fontWeight: font.bold }}
              >
                {recipientAccount?.balance != null
                  ? formatNumber(recipientAccount.balance)
                  : ""}
                {recipientAccount?.currency || "Balance"}
              </Text>
            </View>
          </View>
          <View style={green_line} />
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
          <TextInput
            style={{ ...input, width: "100%", color: "white" }}
            onChangeText={(text) => handleChange(text, "amount")}
            placeholderTextColor={colors.primaryGreen}
            placeholder="Amount*"
            keyboardType="decimal-pad"
            clearButtonMode="while-editing"
            maxLength={20}
            selectionColor={colors.primaryGreen}
          />
          <Text style={body}> Subcategory</Text>
          <ScrollView horizontal style={styles.subcats}>
            <TouchableOpacity
              onPress={() =>
                setTransactionData({ ...transactionData, subcategory: "" })
              }
              style={{
                ...styles.subcat,
                opacity: transactionData.subcategory === "" ? 1 : 0.5,
              }}
            >
              <Text style={body}>?</Text>
              <Text style={caption1}>Without</Text>
            </TouchableOpacity>
            {activeAccount?.subcategories?.map((subcat) => (
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
            <TouchableOpacity onPress={createSubcatAlert} style={styles.subcat}>
              <Text style={body}>+</Text>
              <Text style={caption1}>Add</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={green_line} />
          <View style={{ minWidth: "100%" }}>
            <View style={{ ...accounts__block }}>
              <FlatList
                scrollEnabled={false}
                style={accounts__body}
                data={Accounts.filter(
                  (acc) =>
                    acc.type ===
                    ((activeAccount?.type === "income" && "personal") ||
                      (activeAccount?.type === "personal" && "expense"))
                )}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                numColumns={5}
              />
            </View>
            {activeAccount?.type === "personal" &&
              Accounts.filter((acc) => acc.type === "personal").filter(
                (acc) => acc._id !== activeAccount?._id
              ).length > 0 && (
                <View style={styles.personal}>
                  <View style={{ ...green_line, minWidth: "100%" }} />
                  <FlatList
                    scrollEnabled={false}
                    style={accounts__body}
                    data={Accounts.filter(
                      (acc) => acc.type === "personal"
                    ).filter((acc) => acc._id !== activeAccount?._id)}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    numColumns={5}
                  />
                  <View style={{ ...green_line, minWidth: "100%" }} />
                </View>
              )}
            {message ? (
              <Text style={{ color: "white" }}>{message}</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity style={{ ...submit_button }} onPress={handleSubmit}>
        <Text style={submit_button_text}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  personal: {
    width: "100%",
    flex: 1,
    gap: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
});

export default NewOperation;
