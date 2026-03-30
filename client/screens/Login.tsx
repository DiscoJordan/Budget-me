import React, { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      if (response.data.ok) {
        await login(response.data.token);
      } else {
        setMessage(response.data.message);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ ...container, minHeight: "100%" }}>
      <Text style={styles.h1}>{t("auth.logIn")}</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => handleChange(text, "username")}
        inlineImageLeft="search_icon"
        placeholderTextColor={colors.primaryGreen}
        placeholder={t("auth.username")}
        textContentType="username"
        clearButtonMode={"while-editing"}
        maxLength={20}
        selectionColor={"#primaryGreen"}
        lineBreakStrategyIOS={"push-out"}
      />
      <TextInput
        onChangeText={(text) => handleChange(text, "password")}
        style={styles.input}
        placeholder={t("auth.password")}
        placeholderTextColor={colors.primaryGreen}
        clearButtonMode={"while-editing"}
        secureTextEntry={true}
        selectionColor={"#primaryGreen"}
      />

      <TouchableOpacity style={styles.submit_button} onPress={handleSubmit}>
        <Text style={styles.submit_button_text}>{t("auth.logIn")}</Text>
      </TouchableOpacity>
      <Text style={caption1}>
        {t("auth.noAccount")}
        <Text
          style={styles.green}
          onPress={() => navigation.navigate("Registration")}
        >
          {t("auth.signUp")}
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
