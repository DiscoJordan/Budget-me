import React, { useEffect, useState } from "react";
import axios from "axios";
import { URL } from "../config";
import * as jose from "jose";
export const UsersContext = React.createContext();

export const UsersProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState([]);
  const [token, setToken] = useState(JSON.parse(localStorage.getItem("token")));
  const [user, setUser] = useState();

  const verify_token = async () => {
    try {
      if (!token) {
        setIsLoggedIn(false);
      } else {
        // axios.defaults.headers.common["Authorization"] = token;
        const response = await axios.post(`${URL}/user/verify_token`);
        return response.data.ok ? login(token) : logout();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const login = (token) => {
    let decodedToken = jose.decodeJwt(token);
    let user = {
      username: decodedToken.username,
      email: decodedToken.email,
      id: decodedToken.id,
      currency: decodedToken.currency,
    };
    localStorage.setItem("token", JSON.stringify(token));
    localStorage.setItem("user", JSON.stringify(user));
    setIsLoggedIn(true);
    setUser(user);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  const getUserData = async () => {
    axios.defaults.headers.common["Authorization"] = token;
    try {
      const response = await axios.get(`${URL}/user/get/${user.id}`);
      setUser(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getUsers = async () => {
    axios.defaults.headers.common["Authorization"] = token;
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
        userData,
        login,
        logout,
        verify_token,
        
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};
