import React, { useState, useContext, useEffect } from "react";
import uuid from "react-native-uuid";
import Dialog from "react-native-dialog";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Button,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { CurrencyContext } from "../context/CurrencyContext";
import { getCurrencyMeta } from "../utils/currencyInfo";
import {
  container,
  h1,
  input,
  blue,
  submit_button,
  submit_button_text,
  colors,
  font,
  caption1,
  subheadline,
  caption2,
  body,
  size,
  account,
  accounts__add,
} from "../styles/styles";
import { URL } from "../config";
import axios from "axios";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Subcategory } from "../src/types";

function NewAccount({ navigation }: { navigation: any }) {
  const { login, user } = useContext(UsersContext);
  const {
    getAccountsOfUser,
    activeAccount,
    iconColors,
    createSubcatAlert,
    accountData,
    getRandomColor,
    setAccountData,
    randomColor,
    type,
  } = useContext(AccountsContext);
  const { currencies, mainCurrency } = useContext(CurrencyContext);
  const [message, setMessage] = useState<string>("");
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [currentSubcat, setCurrentSubcat] = useState<Subcategory | null>(null);
  const [newSubcatName, setNewSubcatName] = useState<string>("");
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  useEffect(() => {
    console.log(accountData, "accountData");
    if (accountData.icon) {
      setAccountData(accountData);
    } else {
      getRandomColor();
    }
    // Set default currency if not already set (new account only)
    if (!accountData.currency && type !== "edit") {
      setAccountData((prev) => ({ ...prev, currency: mainCurrency }));
    }
    console.log("type: ", type);
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (type !== "edit") {
        const response = await axios.post(
          `${URL}/accounts/addaccount`,
          accountData,
        );
        setMessage(response.data.data);
        console.log(response.data.data);
        setTimeout(() => {
          setMessage("");
        }, 2000);
        if (response.data.ok) {
          getAccountsOfUser();
          navigation.navigate("Home", { screen: "Dashboard" });
        }
      } else {
        const response = await axios.post(`${URL}/accounts/updateaccount`, {
          accountData,
        });
        setMessage(response.data.data);
        console.log(response.data.data);
        setTimeout(() => {
          setMessage("");
        }, 2000);
        if (response.data.ok) {
          getAccountsOfUser();
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
    <View
      style={{
        ...container,
        padding: 20,
        alignItems: "center",
        minHeight: "100%",
        maxHeight: "100%",
      }}
    >
      <View style={{ ...account }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Choose icon")}
          style={{
            ...accounts__add,
            backgroundColor: accountData.icon.color,
          }}
        >
          <MaterialCommunityIcons
            name={
              (accountData?.icon?.icon_value ||
                activeAccount?.icon?.icon_value ||
                "credit-card-outline") as any
            }
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <Text style={{ ...subheadline, color: colors.gray, fontWeight: "600" }}>
          Icon
        </Text>
      </View>
      <TextInput
        style={styles.input}
        onChangeText={(text) => handleChange(text, "name")}
        value={accountData?.name}
        inlineImageLeft="search_icon"
        placeholderTextColor={colors.primaryGreen}
        placeholder="Title*"
        clearButtonMode={"while-editing"}
        maxLength={20}
        selectionColor={"#primaryGreen"}
        lineBreakStrategyIOS={"push-out"}
      />
      {accountData.type === "personal" && (
        <TextInput
          style={styles.input}
          onChangeText={(text) =>
            setAccountData({ ...accountData, balance: parseFloat(text) || 0 })
          }
          value={accountData.balance ? String(accountData.balance) : ""}
          placeholderTextColor={colors.primaryGreen}
          placeholder="Balance"
          keyboardType="decimal-pad"
          clearButtonMode="while-editing"
          selectionColor={colors.primaryGreen}
        />
      )}
      {accountData.type !== "personal" && (
        <>
          <Text style={{ ...styles.h1, width: "100%" }}>Subcategories</Text>
          {accountData?.subcategories?.map((subcat) => (
            <Text
              onPress={() =>
                showEditDialog(
                  accountData.subcategories[
                    accountData.subcategories.map((e) => e.id).indexOf(subcat.id)
                  ],
                )
              }
              key={uuid.v4() as string}
              style={{ ...caption1, width: "100%", paddingLeft: 8 }}
            >
              {subcat.subcategory}
            </Text>
          ))}
          <View style={{ alignSelf: "flex-start" }}>
            <Button title="Add" onPress={createSubcatAlert} />
          </View>
        </>
      )}
      <TouchableOpacity
        onPress={() => setCurrencyModalVisible(true)}
        style={styles.currencyRow}
      >
        <Text style={{ ...subheadline, color: "white" }}>Currency</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ ...subheadline, color: colors.gray, fontWeight: "600" }}>
            {accountData.currency || mainCurrency} {getCurrencyMeta(accountData.currency || mainCurrency).symbol}
          </Text>
          <Feather name="chevron-right" size={18} color={colors.gray} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submit_button} onPress={handleSubmit}>
        <Text style={styles.submit_button_text}>Save</Text>
      </TouchableOpacity>

      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose currency</Text>
            <TouchableOpacity onPress={() => { setCurrencyModalVisible(false); setCurrencySearch(""); }}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.currencySearch}
            placeholder="Search..."
            placeholderTextColor={colors.gray}
            value={currencySearch}
            onChangeText={setCurrencySearch}
            autoCapitalize="characters"
          />
          <FlatList
            data={currencies.filter((c) => {
              const s = currencySearch.toLowerCase();
              return c.toLowerCase().includes(s) || getCurrencyMeta(c).name.toLowerCase().includes(s);
            })}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const meta = getCurrencyMeta(item);
              const selected = item === (accountData.currency || mainCurrency);
              return (
                <TouchableOpacity
                  style={[styles.currencyItem, selected && styles.currencyItemActive]}
                  onPress={() => {
                    setAccountData({ ...accountData, currency: item });
                    setCurrencyModalVisible(false);
                    setCurrencySearch("");
                  }}
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
        </View>
      </Modal>

      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>Edit Subcategory</Dialog.Title>
        <Dialog.Description>
          Enter your new subcategory below
        </Dialog.Description>
        <Dialog.Input value={newSubcatName} onChangeText={setNewSubcatName} />
        <Dialog.Button label="Cancel" onPress={() => setDialogVisible(false)} />
        <Dialog.Button label="Delete" onPress={deleteSubcat} />
        <Dialog.Button label="Save" onPress={editAlert} />
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
    marginBottom: 8,
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
  currencySearch: {
    backgroundColor: colors.darkGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "white",
    fontSize: 17,
    marginBottom: 12,
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
});

export default NewAccount;
