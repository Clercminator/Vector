import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/app/components/language-provider";
import { SUPPORTED_LANGUAGES } from "@/lib/translations";
import { Globe, Check } from "lucide-react";
import {
  buildLocalizedPath,
  isLocalizedPublicPath,
  normalizePathname,
} from "@/lib/seo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSelectLanguage = (
    nextLanguage: (typeof SUPPORTED_LANGUAGES)[number]["code"],
  ) => {
    setLanguage(nextLanguage);

    const normalizedPath = normalizePathname(location.pathname);
    if (!isLocalizedPublicPath(normalizedPath)) {
      return;
    }

    const params = new URLSearchParams(location.search);
    params.delete("lang");

    const nextPath = buildLocalizedPath(normalizedPath, nextLanguage);
    const search = params.toString();
    const nextUrl = `${nextPath}${search ? `?${search}` : ""}${location.hash}`;

    if (nextUrl !== `${location.pathname}${location.search}${location.hash}`) {
      navigate(nextUrl);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 font-medium text-sm flex items-center gap-1 focus:outline-none cursor-pointer"
          title="Switch Language"
        >
          <Globe size={18} />
          <span>{language.toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSelectLanguage(lang.code)}
            className="flex items-center justify-between gap-2"
          >
            <span>{lang.label}</span>
            {language === lang.code && <Check size={14} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
