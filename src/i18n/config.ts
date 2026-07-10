import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en/common.json";
import fa from "./locales/fa/common.json";

export const SUPPORTED_LANGUAGES = ["en", "fa"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const RTL_LANGUAGES: SupportedLanguage[] = ["fa"];
export const LANGUAGE_STORAGE_KEY = "hd_lang";

export function isRtl(language: string): boolean {
  return RTL_LANGUAGES.includes(language as SupportedLanguage);
}

/** Applies the correct `dir` / `lang` attributes on <html> for the given language. */
export function applyDocumentDirection(language: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.documentElement.dir = isRtl(language) ? "rtl" : "ltr";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      fa: { common: fa },
    },
    ns: ["common"],
    defaultNS: "common",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

applyDocumentDirection(i18n.resolvedLanguage ?? i18n.language ?? "en");

i18n.on("languageChanged", (lng) => {
  applyDocumentDirection(lng);
});

export default i18n;
