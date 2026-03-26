import React, { createContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DebtsSettings, DebtsContextType } from "../src/types";

const STORAGE_KEY = "debts_settings";
const DEFAULT: DebtsSettings = { enabled: false, includeInPersonalBalance: false };

export const DebtsContext = createContext<DebtsContextType>({
  settings: DEFAULT,
  setEnabled: async () => {},
  setIncludeInPersonalBalance: async () => {},
});

export const DebtsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<DebtsSettings>(DEFAULT);
  const ref = useRef(settings);
  ref.current = settings;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
    });
  }, []);

  const save = async (next: DebtsSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setEnabled = async (v: boolean) => save({ ...ref.current, enabled: v });

  const setIncludeInPersonalBalance = async (v: boolean) =>
    save({ ...ref.current, includeInPersonalBalance: v });

  return (
    <DebtsContext.Provider value={{ settings, setEnabled, setIncludeInPersonalBalance }}>
      {children}
    </DebtsContext.Provider>
  );
};
