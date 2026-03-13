import * as React from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";
import { useTheme } from "next-themes";

/**
 * Sonner Toaster wrapper for this Vite/React app.
 * Follows the app's light/dark theme from next-themes.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme as "light" | "dark") || "light"}
      position="top-right"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
