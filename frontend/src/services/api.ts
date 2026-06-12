const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:5001";

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function saveTokens(accessToken: string | null, refreshToken: string | null) {
  if (accessToken) localStorage.setItem("access_token", accessToken);
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function headers(token?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const activeToken = token || getAccessToken();
  if (activeToken) {
    h["Authorization"] = `Bearer ${activeToken}`;
  }
  return h;
}

function normalizeAuthResponse(obj: any, statusCode: number) {
  if (!obj) {
    return { 
      accessToken: null, 
      refreshToken: null, 
      success: statusCode >= 200 && statusCode < 300,
      message: statusCode >= 200 && statusCode < 300 ? "Sucesso." : "Não autenticado."
    };
  }
  
  const accessToken = obj?.accessToken ?? obj?.AccessToken ?? obj?.token ?? obj?.access_token ?? null;
  const refreshToken = obj?.refreshToken ?? obj?.RefreshToken ?? obj?.refresh_token ?? null;
  const message = obj?.message ?? obj?.error ?? "Processado.";
  
  return { 
    accessToken, 
    refreshToken, 
    success: statusCode >= 200 && statusCode < 300, 
    message 
  };
}

/* ==================== CHAMADAS DIRETAS DA API ==================== */

export async function register(payload: { name: string; email: string; password: string }) {
  try {
    const res = await fetch(`${API_BASE}/api/Auth/register`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch {
    return { success: false, message: "Erro de conexão com o servidor." };
  }
}

export async function login(payload: { email: string; password: string }) {
  try {
    const res = await fetch(`${API_BASE}/api/Auth/login`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    return normalizeAuthResponse(json, res.status);
  } catch {
    return normalizeAuthResponse(null, 503);
  }
}