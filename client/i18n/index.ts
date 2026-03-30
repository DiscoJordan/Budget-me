import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import be from "./locales/be.json";
import de from "./locales/de.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import pl from "./locales/pl.json";
import pt from "./locales/pt.json";
import ru from "./locales/ru.json";
import ua from "./locales/ua.json";

const LANG_KEY = "app_language";

export const resources = { be, de, en, es, fr, it, pl, pt, ru, ua } as const;
export type LangCode = keyof typeof resources;
export const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "be", label: "Беларуская" },
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "pl", label: "Polski" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ua", label: "Українська" },
];

i18n.use(initReactI18next).init({
  resources: {
    be: { translation: be },
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    it: { translation: it },
    pl: { translation: pl },
    pt: { translation: pt },
    ru: { translation: ru },
    ua: { translation: ua },
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
