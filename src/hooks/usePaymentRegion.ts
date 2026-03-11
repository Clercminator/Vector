import React from "react";

/**
 * Payment region detection for showing the right payment options.
 * LATAM: MercadoPago
 * Global (US/EU/rest): Lemon Squeezy
 * Binance Pay: Always visible for crypto users
 *
 * Uses Geo-IP (free ip-api.com) with localStorage override.
 */

const STORAGE_KEY = "vector_payment_region";

export type PaymentRegion = "latam" | "global";

const LATAM_COUNTRY_CODES = new Set([
  "AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "SV",
  "GT", "HN", "MX", "NI", "PA", "PY", "PE", "UY", "VE",
]);

export function usePaymentRegion(): {
  region: PaymentRegion;
  setRegion: (r: PaymentRegion) => void;
  isLoading: boolean;
} {
  const [region, setRegionState] = React.useState<PaymentRegion>("global");
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PaymentRegion | null;
    if (stored === "latam" || stored === "global") {
      setRegionState(stored);
      setIsLoading(false);
      return;
    }

    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        const code = data?.country_code?.toUpperCase();
        const detected: PaymentRegion = code && LATAM_COUNTRY_CODES.has(code) ? "latam" : "global";
        setRegionState(detected);
      })
      .catch(() => setRegionState("global"))
      .finally(() => setIsLoading(false));
  }, []);

  const setRegion = React.useCallback((r: PaymentRegion) => {
    setRegionState(r);
    localStorage.setItem(STORAGE_KEY, r);
  }, []);

  return { region, setRegion, isLoading };
}
