import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n/config";

const LANGUAGE_LABEL_KEYS: Record<SupportedLanguage, string> = {
  en: "language.en",
  fa: "language.fa",
};

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language) as SupportedLanguage;

  function handleSelect(lng: SupportedLanguage) {
    if (lng !== currentLanguage) {
      i18n.changeLanguage(lng);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("header.language")}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{t("header.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuItem key={lng} onClick={() => handleSelect(lng)}>
            <span className="flex-1">{t(LANGUAGE_LABEL_KEYS[lng])}</span>
            {currentLanguage === lng && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
