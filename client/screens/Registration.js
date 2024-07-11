import React, { useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  container,
  h1,
  input,
  blue,
  submit_button,
  submit_button_text,
} from "../styles/styles";
import { URL } from "../config";
import axios from "axios";
import { UsersContext } from "../context/UsersContext";


function Registration() {
  const {login} = useContext(UsersContext);
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const handleChange = (value, name) => {
    setUserData({ ...userData, [name]: value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post(`${URL}/users/reg`, {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            password2: userData.password2
        });
        setMessage(response.data.message);
        setTimeout(() => {
          setMessage("");
        }, 2000);
        if (response.data.ok) {
          setTimeout(() => {
            login(response.data.token);

          }, 2000);
        }
    } catch (error) {
        console.log(error);
    }
};

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Sign up</Text>
      <Text style={styles.h1}>{message}</Text>
      <TextInput
        onChangeText={(text) => handleChange(text, "username")}
        name={"username"}
        inlineImageLeft="search_icon"
        style={styles.input}
        placeholder="Username*"
        textContentType="username"
        clearButtonMode={"while-editing"}
        maxLength={20}
        selectionColor={"#009F9C"}
        lineBreakStrategyIOS={"push-out"}
      ></TextInput>
      <TextInput
        onChangeText={(text) => handleChange(text, "email")}
        inlineImageLeft="search_icon"
        style={styles.input}
        placeholder="Email*"
        textContentType="email"
        clearButtonMode={"while-editing"}
        maxLength={20}
        selectionColor={"#009F9C"}
      ></TextInput>
      <TextInput
        onChangeText={(text) => handleChange(text, "password")}
        style={styles.input}
        placeholder="Password*"
        clearButtonMode={"while-editing"}
        secureTextEntry={true}
        selectionColor={"#009F9C"}
      ></TextInput>
      <TextInput
        onChangeText={(text) => handleChange(text, "password2")}
        style={styles.input}
        placeholder="Repeat password*"
        clearButtonMode={"while-editing"}
        secureTextEntry={true}
        selectionColor={"#009F9C"}
      ></TextInput>
      <TouchableOpacity style={styles.submit_button} onPress={handleSubmit}>
        <Text style={styles.submit_button_text}>Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container,
  h1,
  input,
  blue,
  submit_button,
  submit_button_text,
});
export default Registration;
