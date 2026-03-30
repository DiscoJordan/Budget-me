import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import pl from "./locales/pl.json";

const LANG_KEY = "app_language";

export const resources = { en, ru, pl } as const;
export type LangCode = keyof typeof resources;
export const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "pl", label: "Polski" },
];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    pl: { translation: pl },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

// Load saved language on startup
AsyncStorage.getItem(LANG_KEY).then((lang) => {
  if (lang && lang in resources) i18n.changeLanguage(lang);
});

export async function setLanguage(code: LangCode) {
  await AsyncStorage.setItem(LANG_KEY, code);
  i18n.changeLanguage(code);
}

export default i18n;
