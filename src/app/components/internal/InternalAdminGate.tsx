import { useState } from "react";
import { AdminLoginPage, getInternalAdminCredentials } from "./AdminLoginPage";
import { InternalAdminPanel } from "./InternalAdminPanel";

export function InternalAdminGate() {
  const [authenticated, setAuthenticated] = useState(() =>
    getInternalAdminCredentials() !== null
  );

  if (authenticated) {
    return (
      <InternalAdminPanel
        onBack={() => {
          setAuthenticated(false);
        }}
      />
    );
  }

  return <AdminLoginPage onSuccess={() => setAuthenticated(true)} />;
}
