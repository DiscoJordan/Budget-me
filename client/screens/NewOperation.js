import React, { useContext, useState, useEffect, useMemo } from "react";
import { URL } from "../config";
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

const NewOperation = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const {
    activeAccount,
    accounts,
    setBalance,
    recipientAccount,
    setRecipientAccount,
    createSubcatAlert
  } = useContext(AccountsContext);
  const { user } = useContext(UsersContext);

  const [transactionData, setTransactionData] = useState({
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
  

  const Accounts = useMemo(() => [...accounts], [accounts]);

  Number.prototype.format = function() {
    var num = this.toFixed(2);
    var parts = num.split('.');
    var integerPart = parts[0];
    var formattedIntegerPart = '';
  
    for (var i = integerPart.length - 1; i >= 0; i--) {
      formattedIntegerPart = integerPart.charAt(i) + formattedIntegerPart;
      if ((integerPart.length - i) % 3 === 0 && i !== 0) {
        formattedIntegerPart = ' ' + formattedIntegerPart;
      }
    }
    var fractionalPart = parts[1] || '';
    while (fractionalPart.length > 0 && fractionalPart[fractionalPart.length - 1] === '0') {
      fractionalPart = fractionalPart.slice(0, -1);
    }
    if (fractionalPart.length > 0) {
      return formattedIntegerPart + '.' + fractionalPart;
    } else {
      return formattedIntegerPart;
    }
  };
    
  const renderItem = ({ item }) => {
    return <Item item={item} />;
  };

  const handleChange = (value, name) => {
    setTransactionData({ ...transactionData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(`${URL}/transactions/addTransaction`, {
        ownerId: transactionData.ownerId,
        senderId: transactionData.senderId,
        recipientId: transactionData.recipientId,
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
        navigation.navigate("Dashboard");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const Item = ({ item }) => (
    <View style={account}>
      <TouchableOpacity
        onPress={() => setRecipientAccount(item)}
        style={[accounts__add, { backgroundColor: item.icon.color }]}
      >
        <MaterialCommunityIcons
          name={item.icon.icon_value}
          size={24}
          color="white"
        />
      </TouchableOpacity>
      <Text style={{ ...caption1, color: colors.gray, fontWeight: font.bold }}>
        {item.name}
      </Text>
      <Text style={{ ...caption1, color: "white", fontWeight: font.bold }}>
        {item.balance.format()} {item.currency}
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
                  name={activeAccount.icon.icon_value}
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
                {activeAccount.name}
              </Text>
              <Text
                style={{ ...caption1, color: "white", fontWeight: font.bold }}
              >
                {activeAccount.balance.format()} {activeAccount.currency}
              </Text>
            </View>
            <EvilIcons name="arrow-right" size={48} color="white" />
            <View style={account}>
              <TouchableOpacity
                onPress={() => setModalVisible(!modalVisible)}
                style={[
                  accounts__add,
                  { backgroundColor: recipientAccount?.icon?.color || "gray" },
                ]}
              >
                {recipientAccount.icon ? (
                  <MaterialCommunityIcons
                    name={recipientAccount.icon.icon_value}
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
                {recipientAccount?.balance}
                {recipientAccount?.currency || "Balance"}
              </Text>
            </View>
          </View>
          <View style={green_line}></View>
          <TextInput
            style={{ ...input, width: "100%", color: "white" }}
            onChangeText={(text) => handleChange(text, "comment")}
            placeholderTextColor={colors.primaryGreen}
            placeholder="Comment*"
            textContentType="text"
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
            onPress={()=>setTransactionData({...transactionData, subcategory:''})}
              style={{
                ...styles.subcat,
                opacity: transactionData.subcategory === "" ? 1 : 0.5,
              }}
            >
              <Text style={body}>?</Text>
              <Text style={caption1}>Without</Text>
            </TouchableOpacity>
            {activeAccount.subcategories?.map((subcat) => (
              <TouchableOpacity
              onPress={()=>setTransactionData({...transactionData, subcategory:subcat.subcategory})}
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

          <View style={green_line}></View>
          <View style={{ minWidth: "100%" }}>
            <View style={{ ...accounts__block }}>
              <FlatList
                scrollEnabled={false}
                style={accounts__body}
                data={Accounts.filter(
                  (acc) =>
                    acc.type ===
                    ((activeAccount.type === "income" && "personal") ||
                      (activeAccount.type === "personal" && "expense"))
                )}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                numColumns={5}
              />
            </View>
            {activeAccount.type === "personal" &&
              Accounts.filter((acc) => acc.type === "personal").filter(
                (acc) => acc._id !== activeAccount._id
              ).length > 0 && (
                <View style={styles.personal}>
                  <View style={{ ...green_line, minWidth: "100%" }}></View>
                  <FlatList
                    scrollEnabled={false}
                    style={accounts__body}
                    data={Accounts.filter(
                      (acc) => acc.type === "personal"
                    ).filter((acc) => acc._id !== activeAccount._id)}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    numColumns={5}
                  />
                  <View style={{ ...green_line, minWidth: "100%" }}></View>
                </View>
              )}
            {message && <Text style={{ color: "white" }}>{message}</Text>}
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
    maxHeight: "auto",
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
});

export default NewOperation;
