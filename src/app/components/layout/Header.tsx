import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/app/components/Logo";
import { trackClick } from "@/lib/analytics";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { LanguageToggle } from "@/app/components/language-toggle";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/app/components/language-provider";
import { buildLocalizedPath, normalizePathname } from "@/lib/seo";

interface HeaderProps {
  userEmail: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userEmail,
  avatarUrl,
  isAdmin,
  isMenuOpen,
  onMenuToggle,
  onSignOut,
  onSignIn,
  onGetStarted,
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);
  const isArticlesRoute =
    pathname === "/guides" ||
    pathname.startsWith("/frameworks/") ||
    pathname.startsWith("/articles/");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          to={buildLocalizedPath("/", language)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Logo className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold tracking-tight text-black dark:text-white">
            VECTOR
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          <Link
            to={buildLocalizedPath("/", language)}
            className={`text-sm font-medium transition-colors cursor-pointer ${pathname === "/" ? "text-black dark:text-white font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"}`}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            {t("nav.frameworks")}
          </Link>
          <Link
            to={buildLocalizedPath("/guides", language)}
            className={`text-sm font-medium transition-colors cursor-pointer ${isArticlesRoute ? "text-black dark:text-white font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"}`}
            aria-current={isArticlesRoute ? "page" : undefined}
          >
            {t("nav.articles")}
          </Link>
          <button
            onClick={() => navigate("/community")}
            className={`text-sm font-medium transition-colors cursor-pointer ${location.pathname === "/community" ? "text-black dark:text-white font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"}`}
            aria-current={
              location.pathname === "/community" ? "page" : undefined
            }
          >
            {t("nav.community")}
          </button>
          {userEmail && (
            <>
              <button
                onClick={() => navigate("/today")}
                className={`text-sm font-medium transition-colors cursor-pointer ${location.pathname === "/today" ? "text-black dark:text-white font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"}`}
                aria-current={
                  location.pathname === "/today" ? "page" : undefined
                }
              >
                {t("tracker.today") || "Today"}
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className={`text-sm font-medium transition-colors cursor-pointer ${location.pathname === "/dashboard" ? "text-black dark:text-white font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"}`}
                aria-current={
                  location.pathname === "/dashboard" ? "page" : undefined
                }
              >
                {t("nav.blueprints")}
              </button>
            </>
          )}
          <Link
            to={buildLocalizedPath("/pricing", language)}
            className={`text-sm font-medium transition-colors cursor-pointer ${pathname === "/pricing" ? "text-black dark:text-white font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"}`}
            aria-current={pathname === "/pricing" ? "page" : undefined}
          >
            {t("nav.pricing")}
          </Link>
          <Link
            to={buildLocalizedPath("/about", language)}
            className={`text-sm font-medium transition-colors cursor-pointer ${pathname === "/about" ? "text-black dark:text-white font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"}`}
            aria-current={pathname === "/about" ? "page" : undefined}
          >
            {t("nav.about")}
          </Link>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-2" />

          <ThemeToggle />
          <LanguageToggle />

          {userEmail && (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
              aria-current={
                location.pathname === "/profile" ? "page" : undefined
              }
            >
              <Avatar className="w-8 h-8 ring-2 ring-gray-100 dark:ring-zinc-800 transition-all hover:ring-4">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback className="bg-gray-100 dark:bg-zinc-800 text-xs text-black dark:text-white">
                  {userEmail?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className={`text-sm font-medium transition-colors cursor-pointer ${location.pathname === "/admin" ? "text-black dark:text-white font-semibold" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
              aria-current={location.pathname === "/admin" ? "page" : undefined}
            >
              {t("nav.admin")}
            </button>
          )}

          <button
            onClick={() => {
              if (!userEmail) trackClick("nav_signin");
              userEmail ? onSignOut() : onSignIn();
            }}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            {userEmail ? t("nav.signout") : t("nav.signin")}
          </button>
          <button
            onClick={() => {
              trackClick("nav_get_started");
              onGetStarted();
            }}
            className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {t("nav.getStarted")}
          </button>
        </div>

        {/* Mobile Menu Toggle - 44px min touch target */}
        <button
          className="min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center p-2 -m-2 text-gray-900 dark:text-white touch-manipulation lg:hidden"
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? t("common.close") : "Menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};
