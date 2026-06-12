import { getAccessToken, getRefreshToken, saveTokens, clearTokens, headers } from "./api";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:5001";

type Pending = {
  input: RequestInfo;
  init?: RequestInit;
  resolve: (value: Response | PromiseLike<Response>) => void;
  reject: (reason?: any) => void;
};

let isRefreshing = false;
let queue: Pending[] = [];

function drainQueue(err: any | null) {
  queue.forEach(p => {
    if (err) p.reject(err);
    else {
      // Re-executa inserindo o novo token atualizado do LocalStorage
      const retryInit: RequestInit = {
        ...p.init,
        headers: {
          ...headers(),
          ...(p.init?.headers || {})
        }
      };
      fetch(p.input, retryInit).then(p.resolve).catch(p.reject);
    }
  });
  queue = [];
}

async function callRefresh(): Promise<boolean> {
  const rToken = getRefreshToken();
  if (!rToken) return false;

  try {
    const resp = await fetch(`${API_BASE}/api/Auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rToken })
    });

    if (!resp.ok) return false;

    const data = await resp.json();
    const accessToken = data?.accessToken ?? data?.token;
    const refreshToken = data?.refreshToken;

    if (accessToken) {
      saveTokens(accessToken, refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  // Constrói os cabeçalhos padrão incluindo o Bearer Token do LocalStorage automaticamente
  const originalInit: RequestInit = {
    ...init,
    headers: {
      ...headers(),
      ...(init?.headers || {})
    }
  };

  let targetInput = input;
  if (typeof input === "string" && !input.startsWith("http")) {
    const sanitizedPath = input.startsWith("/") ? input : `/${input}`;
    targetInput = `${API_BASE}${sanitizedPath}`;
  }

  let res = await fetch(targetInput, originalInit);
  if (res.status !== 401) return res;

  // Se cair aqui, o Token falhou (401). Iniciamos o fluxo de Refresh automático
  if (isRefreshing) {
    return new Promise<Response>((resolve, reject) => {
      queue.push({ input: targetInput, init, resolve, reject });
    });
  }

  isRefreshing = true;
  const ok = await callRefresh();
  isRefreshing = false;

  if (!ok) {
    clearTokens();
    drainQueue(new Error("Refresh falhou"));
    window.dispatchEvent(new CustomEvent("sessionExpired"));
    return res;
  }

  drainQueue(null);
  
  // Refaz a requisição original com os novos tokens salvos
  return fetch(targetInput, {
    ...init,
    headers: {
      ...headers(),
      ...(init?.headers || {})
    }
  });
}