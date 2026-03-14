import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { INTERNAL_ADMIN_USERNAME, INTERNAL_ADMIN_PASSWORD } from "@/app/lib/internalAdminConfig";
import { internalAdminLogin } from "./internalAdminApi";

const SESSION_KEY = "x7_admin_session";

export function AdminLoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await internalAdminLogin({ username, password });
      if (result.ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        onSuccess();
      } else {
        setError(result.error ?? "Invalid credentials");
      }
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl"
      >
        <h1 className="text-xl font-semibold text-white">Access</h1>
        <p className="text-sm text-zinc-400">Enter credentials to continue.</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm text-zinc-500">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Username"
              required
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-zinc-500">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Password"
              required
              autoComplete="current-password"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying..." : "Continue"}
        </Button>
      </form>
    </div>
  );
}

export function getInternalAdminCredentials(): { username: string; password: string } | null {
  if (typeof sessionStorage === "undefined") return null;
  if (sessionStorage.getItem(SESSION_KEY) !== "1") return null;
  return {
    username: INTERNAL_ADMIN_USERNAME,
    password: INTERNAL_ADMIN_PASSWORD,
  };
}

export function clearInternalAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
