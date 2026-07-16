// i18next setup for Helix. INFRASTRUCTURE ONLY: this wires up language
// switching, RTL/LTR, persistence, and on-demand font loading. It does not
// translate page/component copy — resources here intentionally only cover
// the language switcher itself. Future features can add their own
// namespaces/keys without touching this file.
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import fa from "./locales/fa.json";

export const SUPPORTED_LANGUAGES = ["en", "fa"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const RTL_LANGUAGES: readonly SupportedLanguage[] = ["fa"];
export const LANGUAGE_STORAGE_KEY = "hd_language";

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return value === "en" || value === "fa";
}

export function isRtl(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang as SupportedLanguage);
}

function getStoredLanguage(): SupportedLanguage {
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
    if (isSupportedLanguage(stored)) return stored;
  } catch {
    // localStorage unavailable (SSR, privacy mode, etc.) — fall back silently.
  }
  return "en";
}

export function persistLanguage(lang: SupportedLanguage) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Non-fatal: language just won't survive a reload in this environment.
  }
}

export function applyDocumentDirection(lang: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
}

// Vazirmatn (Persian-optimized font) is only fetched when actually needed,
// so English-only users never pay for it.
let vazirmatnLoadPromise: Promise<unknown> | null = null;
export function ensurePersianFont(): Promise<unknown> {
  if (!vazirmatnLoadPromise) {
    vazirmatnLoadPromise = Promise.all([
      import("@fontsource/vazirmatn/400.css"),
      import("@fontsource/vazirmatn/500.css"),
      import("@fontsource/vazirmatn/700.css"),
    ]);
  }
  return vazirmatnLoadPromise;
}

const initialLanguage = getStoredLanguage();

void i18next.use(initReactI18next).init({
  resources: {
    en: { common: en },
    fa: { common: fa },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
  ns: ["common"],
  defaultNS: "common",
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

// Apply synchronously on load so there's no flash of wrong direction/lang.
applyDocumentDirection(initialLanguage);
if (isRtl(initialLanguage)) void ensurePersianFont();

i18next.on("languageChanged", (lng) => {
  applyDocumentDirection(lng);
  if (isSupportedLanguage(lng)) persistLanguage(lng);
  if (isRtl(lng)) void ensurePersianFont();
});

export default i18next;
