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

interface LoginFormData {
  username: string;
  password: string;
}

function Login({ navigation }: { navigation: any }) {
  const { login } = useContext(UsersContext);
  const [message, setMessage] = useState<string>("");
  const [userData, setUserData] = useState<LoginFormData>({
    username: "",
    password: "",
  });

  const handleChange = (value: string, name: keyof LoginFormData) => {
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${URL}/users/login`, {
        username: userData.username,
        password: userData.password,
      });
      setMessage(response.data.message);
      console.log(response);
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
    <View style={{ ...container, minHeight: "100%" }}>
      <Text style={styles.h1}>Log Indd</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => handleChange(text, "username")}
        inlineImageLeft="search_icon"
        placeholderTextColor={colors.primaryGreen}
        placeholder="Username*"
        textContentType="username"
        clearButtonMode={"while-editing"}
        maxLength={20}
        selectionColor={"#primaryGreen"}
        lineBreakStrategyIOS={"push-out"}
      />
      <TextInput
        onChangeText={(text) => handleChange(text, "password")}
        style={styles.input}
        placeholder="Password*"
        placeholderTextColor={colors.primaryGreen}
        clearButtonMode={"while-editing"}
        secureTextEntry={true}
        selectionColor={"#primaryGreen"}
      />

      <TouchableOpacity style={styles.submit_button} onPress={handleSubmit}>
        <Text style={styles.submit_button_text}>Log In</Text>
      </TouchableOpacity>
      <Text style={caption1}>
        Dont have an account?{" "}
        <Text
          style={styles.green}
          onPress={() => navigation.navigate("Registration")}
        >
          Sign Up
        </Text>
      </Text>
      {message ? <Text>{message}</Text> : null}
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
});

export default Login;
