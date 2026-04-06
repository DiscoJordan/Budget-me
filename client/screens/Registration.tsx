import React, { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import GlassInput from "../components/GlassInput";
import {
  container,
  h1,
  submit_button,
  submit_button_text,
  colors,
  font,
  size,
  caption2,
  caption1,
} from "../styles/styles";
import { URL } from "../config";
import axios from "axios";
import { UsersContext } from "../context/UsersContext";

interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
  password2: string;
}

function Registration({ navigation }: { navigation: any }) {
  const { login } = useContext(UsersContext);
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>("");
  const [userData, setUserData] = useState<RegistrationFormData>({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const handleChange = (value: string, name: keyof RegistrationFormData) => {
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${URL}/users/reg`, {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        password2: userData.password2,
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
      <Text style={styles.h1}>{t("auth.signUp")}</Text>
      <GlassInput
        containerStyle={styles.inputContainer}
        onChangeText={(text) => handleChange(text, "username")}
        placeholder={t("auth.username")}
        textContentType="username"
        clearButtonMode={"while-editing"}
        maxLength={20}
        autoCapitalize="none"
      />
      <GlassInput
        containerStyle={styles.inputContainer}
        onChangeText={(text) => handleChange(text, "email")}
        placeholder={t("auth.email")}
        textContentType="emailAddress"
        clearButtonMode={"while-editing"}
        maxLength={40}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <GlassInput
        containerStyle={styles.inputContainer}
        onChangeText={(text) => handleChange(text, "password")}
        placeholder={t("auth.password")}
        clearButtonMode={"while-editing"}
        secureTextEntry={true}
      />
      <GlassInput
        containerStyle={styles.inputContainer}
        onChangeText={(text) => handleChange(text, "password2")}
        placeholder={t("auth.repeatPassword")}
        clearButtonMode={"while-editing"}
        secureTextEntry={true}
      />

      <TouchableOpacity style={styles.submit_button} onPress={handleSubmit}>
        <Text style={styles.submit_button_text}>{t("auth.createAccount")}</Text>
      </TouchableOpacity>
      <Text style={caption1}>
        {t("auth.haveAccount")}
        <Text style={styles.green} onPress={() => navigation.navigate("Login")}>
          {t("auth.logIn")}
        </Text>
      </Text>
      {message ? <Text style={{ color: "white" }}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  green: {
    color: colors.primaryGreen,
  },
  inputContainer: {
    marginBottom: 12,
    alignSelf: "stretch",
  },
  container,
  h1,
  submit_button,
  submit_button_text,
});

export default Registration;
