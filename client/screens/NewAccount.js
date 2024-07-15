import React, { useState, useContext } from "react";
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
} from "react-native";
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
  size,
} from "../styles/styles";
import { URL } from "../config";
import axios from "axios";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";

function NewAccount({ navigation,route }) {
    const { type } = route.params;
  const { login, user } = useContext(UsersContext);
  const { getAccountsOfUser } = useContext(AccountsContext);
  const [message, setMessage] = useState("");
  const [accountData, setAccountData] = useState({
    name: "",
    subcategories: [],
    ownerId: user._id,
    type:type,

    // icon: {
    //   color: { type: String, required: false, unique: false, default: 'gray' },
    //   icon_value: { type: String, required: false },
    // },
    
   
    //   }
    // ],
    // balance: { type: Number, required: true, default: 0 }, //balance of account
    // currency: { type: String, required: true, default: 'USD' }, // initial currensy of account
    // time: { type: Date, default: Date.now },  // date when acc was created
  
  });
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentSubcat, setCurrentSubcat] = useState(null);
  const [newSubcatName, setNewSubcatName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
console.log(accountData);
    try {
    //   axios.defaults.headers.common["Authorization"] = token;
      const response = await axios.post(`${URL}/accounts/addaccount`, accountData);
      setMessage(response.data.data);
      setTimeout(() => {
        setMessage("");
      }, 2000);
    //   getPlaces();
      if (response.data.ok) {
        setTimeout(() => {
          navigation.navigate('Dashboard');
        }, 500);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const showEditDialog = (subcat) => {
    setCurrentSubcat(subcat);
    setNewSubcatName(subcat.subcategory);
    setDialogVisible(true);
  };
  const handleChange = (value, name) => {
    setAccountData({ ...accountData, [name]: value });
  };
  
  const createAlert = () =>
    Alert.prompt(
      "New subcategory",
      "Enter your new subcategory below",
      [
        { text: "Cancel", style: "destructive", onPress: () => {} },
        {
          text: "Submit",
          onPress: (subcategory) => {
            if (subcategory.length > 0) {
              let newData = { ...accountData };
              newData.subcategories.push({ subcategory: subcategory, id: uuid.v4() });
              setAccountData(newData);
            }
          },
        },
      ],
      "plain-text"
    );

  const editAlert = () => {
    if (currentSubcat && newSubcatName.length > 0) {
      let index = accountData.subcategories
        .map((e) => e.id)
        .indexOf(currentSubcat.id);

      let newData = { ...accountData };
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
      let newData = { ...accountData };
      newData.subcategories = newData.subcategories.filter(
        (subcat) => subcat.id !== currentSubcat.id
      );
      setAccountData(newData);
    }
    setDialogVisible(false);
  };
  return (
    <View style={styles.container}>
      {/* <Text style={styles.h1}>Title</Text> */}
      <TextInput
        style={styles.input}
        onChangeText={(text) => handleChange(text, "name")}
        name={"name"}
        inlineImageLeft="search_icon"
        placeholderTextColor={colors.primaryGreen}
        placeholder="Title*"
        clearButtonMode={"while-editing"}
        maxLength={20}
        selectionColor={"#primaryGreen"}
        lineBreakStrategyIOS={"push-out"}
      ></TextInput>
      <Text style={styles.h1}>Subcategories</Text>
      {accountData?.subcategories?.map((subcat) => (
        <Text
          onPress={() =>
            showEditDialog(
              accountData.subcategories[
                accountData.subcategories.map((e) => e.id).indexOf(subcat.id)
              ]
            )
          }
          key={subcat.id}
          style={caption1}
        >
          {subcat.subcategory}
        </Text>
      ))}
      <Button title="Add" onPress={createAlert}></Button>
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
      {/* <TextInput
        onChangeText={(text) => handleChange(text, "password")}
        style={styles.input}
        placeholder="Password*"
        placeholderTextColor={colors.primaryGreen}
        clearButtonMode={"while-editing"}
        secureTextEntry={true}
        selectionColor={"#primaryGreen"}
      ></TextInput> */}

      <TouchableOpacity style={styles.submit_button} onPress={handleSubmit}>
        <Text style={styles.submit_button_text}>Save</Text>
      </TouchableOpacity>
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
  blue,
  submit_button,
  submit_button_text,
  colors,
  font,
});
export default NewAccount;
