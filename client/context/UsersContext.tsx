import React, { useEffect, useState, ReactNode } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { URL } from "../config";
import JWT from "expo-jwt";
import { User, UsersContextType } from "../src/types";

export const UsersContext = React.createContext<UsersContextType>(
  {} as UsersContextType
);

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider = ({ children }: UsersProviderProps) => {
  const jwt_secret = "budgetMe";

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    verify_token();
  }, [token]);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          const parsedToken: string = JSON.parse(storedToken);
          axios.defaults.headers.common["Authorization"] = parsedToken;
          setToken(parsedToken);
        }
      } catch (error) {
        console.log("Error loading token from AsyncStorage:", error);
      }
    };
    loadToken();
  }, []);

  const verify_token = async (): Promise<void> => {
    try {
      if (!token) {
        setIsLoggedIn(false);
      } else {
        const response = await axios.post(`${URL}/users/verify_token`);
        return response.data.ok ? login(token) : logout();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const login = async (token: string): Promise<void> => {
    try {
      const decodedToken = JWT.decode(token, jwt_secret) as {
        username: string;
        email: string;
        id: string;
        currency: string;
      };

      const user: User = {
        username: decodedToken.username,
        email: decodedToken.email,
        id: decodedToken.id,
        currency: decodedToken.currency,
      };

      console.log(user);
      await AsyncStorage.setItem("token", JSON.stringify(token));
      await AsyncStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = token;
      setIsLoggedIn(true);
      setUser(user);
      setToken(token);
    } catch (error) {
      console.log("Error saving data to AsyncStorage:", error);
    }
  };

  const logout = async (): Promise<void> => {
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

  const getUserData = async (): Promise<void> => {
    try {
      console.log(user?.id);
      const response = await axios.get(`${URL}/users/get/${user?.id}`);
      setUser(response.data.user);
      console.log(user);
    } catch (error) {}
  };

  const getUsers = async (): Promise<void> => {
    try {
      const response = await axios.get(`${URL}/user/getall`);
      console.log(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

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
