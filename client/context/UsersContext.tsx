import React, { useEffect, useState, ReactNode } from "react";
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { URL } from "../config";
import { User, UsersContextType } from "../src/types";
import { getOrCreateLocalUser } from "../db/localUser";
import { initDB } from "../db/database";

// ─── OFFLINE-FIRST: JWT decode kept for future sync feature ───────────────────
// function decodeJwt(token: string): Record<string, any> {
//   const base64Url = token.split(".")[1];
//   const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//   const padding = "=".repeat((4 - (base64.length % 4)) % 4);
//   const decoded = atob(base64 + padding);
//   return JSON.parse(decoded);
// }

export const UsersContext = React.createContext<UsersContextType>(
  {} as UsersContextType
);

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider = ({ children }: UsersProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function init() {
      await initDB();
      const localUser = await getOrCreateLocalUser();
      setUser(localUser);
      setIsLoggedIn(true);
    }
    init();
  }, []);

  // ─── OFFLINE-FIRST: login / logout / verify_token commented out ──────────────
  // These will be restored when backend sync feature is implemented.

  // const verify_token = async (): Promise<void> => {
  //   try {
  //     if (!token) { setIsLoggedIn(false); return; }
  //     const response = await axios.post(`${URL}/users/verify_token`);
  //     if (response.data.ok) {
  //       setIsLoggedIn(true);
  //       const storedUser = await AsyncStorage.getItem("user");
  //       if (storedUser && !user) setUser(JSON.parse(storedUser));
  //     } else { logout(); }
  //   } catch (error) { console.log(error); }
  // };

  // const login = async (token: string): Promise<void> => {
  //   try {
  //     const decodedToken = decodeJwt(token) as { username: string; email: string; id: string; currency: string };
  //     const user: User = { username: decodedToken.username, email: decodedToken.email, id: decodedToken.id, currency: decodedToken.currency };
  //     await AsyncStorage.setItem("token", JSON.stringify(token));
  //     await AsyncStorage.setItem("user", JSON.stringify(user));
  //     axios.defaults.headers.common["Authorization"] = token;
  //     setIsLoggedIn(true); setUser(user); setToken(token);
  //   } catch (error) { console.log("Error saving data to AsyncStorage:", error); }
  // };

  // const logout = async (): Promise<void> => {
  //   try {
  //     await AsyncStorage.removeItem("token");
  //     await AsyncStorage.removeItem("user");
  //     setIsLoggedIn(false); setUser(null); setToken(null);
  //   } catch (error) { console.log("Error removing data from AsyncStorage:", error); }
  // };

  const login = async (_token: string): Promise<void> => {};
  const logout = async (): Promise<void> => {};
  const verify_token = async (): Promise<void> => {};

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
