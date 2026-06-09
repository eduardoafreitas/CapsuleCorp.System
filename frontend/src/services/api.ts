const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:5001";

function headers(token?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function normalizeAuthResponse(obj: any) {
  if (!obj) return { accessToken: null, refreshToken: null, expiresAt: null, message: null, raw: obj };
  const accessToken = obj?.accessToken ?? obj?.AccessToken ?? obj?.token ?? obj?.access_token ?? obj?.jwt ?? null;
  const refreshToken = obj?.refreshToken ?? obj?.RefreshToken ?? obj?.refresh_token ?? null;
  const expiresAt = obj?.expiresAt ?? obj?.ExpiresAt ?? obj?.expires_at ?? null;
  const message = obj?.message ?? obj?.error ?? null;
  return { accessToken, refreshToken, expiresAt, message, raw: obj };
}

export async function register(payload: { name: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/Auth/register`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function login(payload: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/Auth/login`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => null);
  return normalizeAuthResponse(json);
}

export async function refresh(refreshToken: string) {
  const res = await fetch(`${API_BASE}/api/Auth/refresh`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ refreshToken })
  });
  const json = await res.json().catch(() => null);
  return normalizeAuthResponse(json);
}

export async function revoke(refreshToken: string, token?: string) {
  const res = await fetch(`${API_BASE}/api/Auth/revoke`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ refreshToken })
  });
  return res.json();
}

export async function updateProfile(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/api/Auth/update-profile`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getMe(token: string) {
  const res = await fetch(`${API_BASE}/api/Auth/me`, {
    method: "GET",
    headers: headers(token)
  });
  return res.json();
}

export function saveTokens(accessToken: string | null, refreshToken: string | null) {
  if (accessToken) localStorage.setItem("access_token", accessToken);
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}