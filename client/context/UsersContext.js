import React, { useEffect, useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { URL } from "../config";
import JWT from "expo-jwt";

// import * as jose from "jose";
export const UsersContext = React.createContext();

export const UsersProvider = ({ children }) => {
  const jwt_secret = process.env.EXPO_PUBLIC_JWT_SECRET;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

useEffect(() => {
  verify_token()
}, [token]);

  useEffect(() => {
    
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setToken(JSON.parse(storedToken));
        }
      } catch (error) {
        console.log("Error loading token from AsyncStorage:", error);
      }
    };
    loadToken();
  }, []);

  const verify_token = async () => {
    
    try {
      if (!token) {
        setIsLoggedIn(false);
      } else {
        axios.defaults.headers.common["Authorization"] = token;
        const response = await axios.post(`${URL}/users/verify_token`);
        return response.data.ok ? login(token) : logout();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const login = async (token) => {

    try {
      let decodedToken = JWT.decode(token, jwt_secret);

      let user = {
        username: decodedToken.username,
        email: decodedToken.email,
        id: decodedToken.id,
        currency: decodedToken.currency,
      };
       await AsyncStorage.setItem("token", JSON.stringify(token));
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setIsLoggedIn(true);
      setUser(user);
      setToken(token);
    } catch (error) {
      console.log("Error saving data to AsyncStorage:", error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setIsLoggedIn(false);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.log("Error removing data from AsyncStorage:", error);
    }
  };

  const getUserData = async () => {
    // axios.defaults.headers.common["Authorization"] = token;
    try {
      const response = await axios.get(`${URL}/users/get/${user._id}`);
      setUser(response.data.user);
      console.log(user);
    } catch (error) {
      console.log(`11`,error);
    }
  };

  const getUsers = async () => {
    // axios.defaults.headers.common["Authorization"] = token;
    try {
      const response = await axios.get(`${URL}/user/getall`);
      setUsers(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user) {
      getUserData();
      
    }
  }, [user]);

  return (
    <UsersContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        user,
        setUser,
        token,
        login,
        logout,
        verify_token,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};
