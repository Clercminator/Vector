import React from "react";
import { motion } from "motion/react";
import { useNavigate, useLocation } from "react-router-dom";
import { trackClick } from "@/lib/analytics";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { LanguageToggle } from "@/app/components/language-toggle";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { useLanguage } from "@/app/components/language-provider";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  onSignOut: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  userEmail,
  avatarUrl,
  isAdmin,
  onSignOut,
  onSignIn,
  onGetStarted,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isArticlesRoute =
    location.pathname === "/guides" ||
    location.pathname.startsWith("/frameworks/");

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-40 bg-white dark:bg-zinc-950 pt-24 px-6 pb-8 flex flex-col gap-6 overflow-y-auto overflow-x-hidden"
    >
      <button
        onClick={() => {
          navigate("/");
          onClose();
        }}
        className={`min-h-[48px] flex w-full cursor-pointer items-center border-b border-gray-100 pb-4 text-left text-2xl font-bold dark:border-zinc-800 ${location.pathname === "/" ? "rounded px-2 text-black ring-2 ring-inset ring-gray-400 dark:text-white dark:ring-gray-500" : "text-gray-600 dark:text-gray-400"}`}
      >
        {t("nav.frameworks")}
      </button>
      <button
        onClick={() => {
          navigate("/guides");
          onClose();
        }}
        className={`min-h-[48px] flex w-full cursor-pointer items-center border-b border-gray-100 pb-4 text-left text-2xl font-bold dark:border-zinc-800 ${isArticlesRoute ? "rounded px-2 text-black ring-2 ring-inset ring-gray-400 dark:text-white dark:ring-gray-500" : "text-gray-600 dark:text-gray-400"}`}
      >
        {t("nav.articles")}
      </button>
      <button
        onClick={() => {
          navigate("/community");
          onClose();
        }}
        className={`min-h-[48px] flex w-full cursor-pointer items-center border-b border-gray-100 pb-4 text-left text-2xl font-bold dark:border-zinc-800 ${location.pathname === "/community" ? "rounded px-2 text-black ring-2 ring-inset ring-gray-400 dark:text-white dark:ring-gray-500" : "text-gray-600 dark:text-gray-400"}`}
      >
        {t("nav.community")}
      </button>
      {userEmail && (
        <button
          onClick={() => {
            navigate("/today");
            onClose();
          }}
          className={`min-h-[48px] flex w-full cursor-pointer items-center border-b border-gray-100 pb-4 text-left text-2xl font-bold dark:border-zinc-800 ${location.pathname === "/today" ? "rounded px-2 text-black ring-2 ring-inset ring-gray-400 dark:text-white dark:ring-gray-500" : "text-gray-600 dark:text-gray-400"}`}
        >
          {t("tracker.today") || "Today"}
        </button>
      )}
      {userEmail && (
        <button
          onClick={() => {
            navigate("/dashboard");
            onClose();
          }}
          className={`min-h-[48px] flex w-full cursor-pointer items-center border-b border-gray-100 pb-4 text-left text-2xl font-bold dark:border-zinc-800 ${location.pathname === "/dashboard" ? "rounded px-2 text-black ring-2 ring-inset ring-gray-400 dark:text-white dark:ring-gray-500" : "text-gray-600 dark:text-gray-400"}`}
        >
          {t("nav.blueprints")}
        </button>
      )}
      <button
        onClick={() => {
          navigate("/pricing");
          onClose();
        }}
        className={`min-h-[48px] flex w-full cursor-pointer items-center border-b border-gray-100 pb-4 text-left text-2xl font-bold dark:border-zinc-800 ${location.pathname === "/pricing" ? "rounded px-2 text-black ring-2 ring-inset ring-gray-400 dark:text-white dark:ring-gray-500" : "text-gray-600 dark:text-gray-400"}`}
      >
        {t("nav.pricing")}
      </button>
      <button
        onClick={() => {
          navigate("/about");
          onClose();
        }}
        className={`min-h-[48px] flex w-full cursor-pointer items-center border-b border-gray-100 pb-4 text-left text-2xl font-bold dark:border-zinc-800 ${location.pathname === "/about" ? "rounded px-2 text-black ring-2 ring-inset ring-gray-400 dark:text-white dark:ring-gray-500" : "text-gray-600 dark:text-gray-400"}`}
      >
        {t("nav.about")}
      </button>

      <div className="flex items-center gap-4 py-4">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      {userEmail && (
        <button
          onClick={() => {
            navigate("/profile");
            onClose();
          }}
          className="flex min-h-[48px] w-full cursor-pointer items-center gap-3 border-b border-gray-100 pb-4 text-left text-2xl font-bold text-black dark:border-zinc-800 dark:text-white"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="bg-gray-100 dark:bg-zinc-800 text-xs text-black dark:text-white">
              {userEmail?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {t("nav.profile")}
        </button>
      )}
      {isAdmin && (
        <button
          onClick={() => {
            navigate("/admin");
            onClose();
          }}
          className="flex min-h-[48px] w-full cursor-pointer items-center border-b border-gray-100 pb-4 text-left text-2xl font-bold text-black dark:border-zinc-800 dark:text-white"
        >
          {t("nav.admin")}
        </button>
      )}
      <button
        onClick={() => {
          if (!userEmail) trackClick("nav_signin_mobile");
          onClose();
          userEmail ? onSignOut() : onSignIn();
        }}
        className="flex min-h-[48px] w-full cursor-pointer items-center border-b border-gray-100 pb-4 text-left text-2xl font-bold text-black dark:border-zinc-800 dark:text-white"
      >
        {userEmail ? t("nav.signout") : t("nav.signin")}
      </button>
      <button
        onClick={() => {
          trackClick("nav_get_started_mobile");
          onGetStarted();
          onClose();
        }}
        className="min-h-[48px] w-full cursor-pointer rounded-2xl bg-black py-4 text-lg font-bold text-white touch-manipulation dark:bg-white dark:text-black"
      >
        {t("nav.getStarted")}
      </button>
    </motion.div>
  );
};
