/**
 * API client for the internal admin Edge Function.
 * Credentials are sent with each request for verification.
 */

import { INTERNAL_ADMIN_USERNAME, INTERNAL_ADMIN_PASSWORD } from "@/app/lib/internalAdminConfig";

const SESSION_KEY = "x7_admin_session";

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

const getBaseUrl = () =>
  (import.meta.env.VITE_SUPABASE_URL as string)?.replace(/\/$/, "") ?? "";

export interface InternalAdminCredentials {
  username: string;
  password: string;
}

export async function internalAdminLogin(
  creds: InternalAdminCredentials
): Promise<{ ok: boolean; error?: string }> {
  const url = `${getBaseUrl()}/functions/v1/internal-admin`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: creds.username,
      password: creds.password,
      action: "login",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (data as { error?: string }).error ?? "Login failed" };
  }
  return { ok: true };
}

export async function internalAdminListUsers(
  creds: InternalAdminCredentials,
  opts: { search?: string; page?: number; pageSize?: number } = {}
): Promise<{ users: any[]; total: number; error?: string }> {
  const url = `${getBaseUrl()}/functions/v1/internal-admin`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: creds.username,
      password: creds.password,
      action: "list_users",
      payload: opts,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { users: [], total: 0, error: (data as { error?: string }).error ?? "Failed to fetch users" };
  }
  const d = data as { users?: any[]; total?: number };
  return { users: d.users ?? [], total: d.total ?? 0 };
}

export async function internalAdminUpdateUser(
  creds: InternalAdminCredentials,
  userId: string,
  updates: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const url = `${getBaseUrl()}/functions/v1/internal-admin`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: creds.username,
      password: creds.password,
      action: "update_user",
      payload: { userId, updates },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (data as { error?: string }).error ?? "Failed to update user" };
  }
  return { ok: true };
}
