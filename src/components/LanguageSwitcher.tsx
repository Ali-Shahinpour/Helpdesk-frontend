import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector, setLanguage } from "@/store";
import type { AppLanguage } from "@/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LANGUAGE_OPTIONS: { code: AppLanguage; nativeLabel: string }[] = [
  { code: "en", nativeLabel: "English" },
  { code: "fa", nativeLabel: "فارسی" },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const language = useAppSelector((s) => s.ui.language);

  function handleSelect(code: AppLanguage) {
    if (code === language) return;
    dispatch(setLanguage(code));
    void i18n.changeLanguage(code);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("language.switcher.label")}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.code}
            onClick={() => handleSelect(opt.code)}
            className={cn("justify-between", opt.code === language && "font-semibold")}
          >
            <span>{opt.nativeLabel}</span>
            {opt.code === language && <span className="text-xs text-primary">●</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
