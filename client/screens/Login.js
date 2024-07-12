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
  colors,
  font,
  caption1,
  size,
} from "../styles/styles";
import { URL } from "../config";
import axios from "axios";
import { UsersContext } from "../context/UsersContext";

function Login({ navigation }) {
  const { login } = useContext(UsersContext);
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState({
    username: "",
    password: "",
  });
  const handleChange = (value, name) => {
    setUserData({ ...userData, [name]: value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${URL}/users/login`, {
        username: userData.username,
        password: userData.password,
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
      <Text style={styles.h1}>Log In</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => handleChange(text, "username")}
        name={"username"}
        inlineImageLeft="search_icon"
        placeholderTextColor={colors.primaryGreen}
        placeholder="Username*"
        textContentType="username"
        clearButtonMode={"while-editing"}
        maxLength={20}
        selectionColor={"#primaryGreen"}
        lineBreakStrategyIOS={"push-out"}
      ></TextInput>
      <TextInput
        onChangeText={(text) => handleChange(text, "password")}
        style={styles.input}
        placeholder="Password*"
        placeholderTextColor={colors.primaryGreen}
        clearButtonMode={"while-editing"}
        secureTextEntry={true}
        selectionColor={"#primaryGreen"}
      ></TextInput>

      <TouchableOpacity style={styles.submit_button} onPress={handleSubmit}>
        <Text style={styles.submit_button_text}>Log In</Text>
      </TouchableOpacity>
      <Text style={caption1}>Dont have an account? <Text style={styles.green} onPress={()=>navigation.navigate("Registration")}>Sign Up</Text></Text>
      {message && <Text>{message}</Text>}
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
export default Login;
