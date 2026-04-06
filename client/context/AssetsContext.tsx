import React, { createContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AssetsSettings, AssetsContextType } from "../src/types";

const STORAGE_KEY = "assets_settings";
const DEFAULT: AssetsSettings = { enabled: false, includeInPersonalBalance: false };

export const AssetsContext = createContext<AssetsContextType>({
  settings: DEFAULT,
  setEnabled: async () => {},
  setIncludeInPersonalBalance: async () => {},
});

export const AssetsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<AssetsSettings>(DEFAULT);
  const ref = useRef(settings);
  ref.current = settings;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
    });
  }, []);

  const save = async (next: AssetsSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setEnabled = async (v: boolean) => save({ ...ref.current, enabled: v });

  const setIncludeInPersonalBalance = async (v: boolean) =>
    save({ ...ref.current, includeInPersonalBalance: v });

  return (
    <AssetsContext.Provider value={{ settings, setEnabled, setIncludeInPersonalBalance }}>
      {children}
    </AssetsContext.Provider>
  );
};
