import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

const deviceLocale = getLocales()[0]?.languageCode ?? "en";
const supportedLngs = ["en", "zh"];
const defaultLng = supportedLngs.includes(deviceLocale) ? deviceLocale : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: defaultLng,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
