import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_MQ = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * Matches viewport on first client paint (uses `useSyncExternalStore`).
 * Prefer this when motion/transition props depend on mobile vs desktop.
 */
export function useIsMobileSync(): boolean {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(MOBILE_MQ);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(MOBILE_MQ).matches,
    () => false,
  );
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
