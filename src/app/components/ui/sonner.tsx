import * as React from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

/**
 * Sonner Toaster wrapper for this Vite/React app.
 *
 * Note: The original shadcn/ui template uses `next-themes` for theme detection.
 * This project is not a Next.js app and does not currently mount a ThemeProvider,
 * so we default to a consistent theme and rely on CSS variables for colors.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
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
