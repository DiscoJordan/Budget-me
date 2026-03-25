import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { URL } from "../config";
import { UsersContext } from "./UsersContext";
import { CurrencyContextType } from "../src/types";

export const CurrencyContext = createContext<CurrencyContextType>({} as CurrencyContextType);

const STORAGE_KEY = "currencies_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CurrenciesCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { user, token, login } = useContext(UsersContext);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [mainCurrency, setMainCurrencyState] = useState<string>("USD");
  const [loading, setLoading] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  useEffect(() => {
    if (user?.currency) {
      setMainCurrencyState(user.currency);
    }
  }, [user?.currency]);

  useEffect(() => {
    if (token) {
      fetchCurrencies();
    }
  }, [token]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: CurrenciesCache = JSON.parse(cached);
        if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
          applyRates(parsed.rates, parsed.fetchedAt);
          setLoading(false);
          return;
        }
      }

      const response = await axios.get(`${URL}/currencies`);
      if (response.data.ok) {
        const newCache: CurrenciesCache = { rates: response.data.rates, fetchedAt: Date.now() };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCache));
        applyRates(response.data.rates, newCache.fetchedAt);
      }
    } catch (error) {
      console.log("Error fetching currencies:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyRates = (ratesData: Record<string, number>, fetchedAt?: number) => {
    setRates(ratesData);
    setCurrencies(Object.keys(ratesData).sort());
    if (fetchedAt) {
      setLastFetchedAt(fetchedAt);
    }
  };

  const setMainCurrency = async (currency: string) => {
    try {
      const response = await axios.post(`${URL}/users/update-currency`, { currency });
      if (response.data.ok) {
        setMainCurrencyState(currency);
        if (response.data.token) {
          await login(response.data.token);
        }
      }
    } catch (error) {
      console.log("Error updating currency:", error);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currencies, rates, mainCurrency, setMainCurrency, loading, lastFetchedAt }}>
      {children}
    </CurrencyContext.Provider>
  );
};
