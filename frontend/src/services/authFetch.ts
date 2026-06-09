import { getAccessToken, getRefreshToken, saveTokens, clearTokens, refresh } from "./api";

/**
 * Decodifica JWT (sem validação) e retorna payload JSON.
 */
function parseJwt(token?: string | null) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch {
    return null;
  }
}

/**
 * Retorna true se o token expirar dentro de `secondsThreshold` segundos.
 */
function tokenWillExpireSoon(token: string | null, secondsThreshold = 10) {
  const payload = parseJwt(token);
  if (!payload?.exp) return false;
  const exp = payload.exp as number; // exp em segundos unix
  const now = Math.floor(Date.now() / 1000);
  return exp - now <= secondsThreshold;
}

/**
 * Wrapper fetch que:
 * - tenta pré-refresh se o access token estiver para expirar;
 * - faz a requisição com access token;
 * - em 401 tenta refresh + retry;
 * - em falha de refresh dispara event 'sessionExpired'.
 */
export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  const access = getAccessToken();
  const refreshToken = getRefreshToken();

  console.debug("[authFetch] iniciar requisição", input);

  // Pré-refresh: se token vai expirar em breve, tenta refresh primeiro
  if (access && refreshToken && tokenWillExpireSoon(access, 8)) {
    console.debug("[authFetch] token expirando em breve, tentando refresh proativo");
    const newTokens = await refresh(refreshToken).catch(() => null);
    if (newTokens?.accessToken && newTokens?.refreshToken) {
      saveTokens(newTokens.accessToken, newTokens.refreshToken);
      console.debug("[authFetch] refresh proativo bem-sucedido");
    } else {
      console.debug("[authFetch] refresh proativo falhou");
      // Se proativo falhou, deixamos seguir para a requisição (será 401) ou já notifica
      // opcional: limpar tokens e notificar aqui:
      // clearTokens(); window.dispatchEvent(new CustomEvent('sessionExpired'));
    }
  }

  // Obtém o access token atualizado (pode ter sido trocado)
  const currentAccess = getAccessToken();

  const originalInit = init ? { ...init } : {};
  originalInit.headers = {
    ...(originalInit.headers as Record<string, string>),
    "Content-Type": "application/json",
    ...(currentAccess ? { Authorization: `Bearer ${currentAccess}` } : {})
  };

  let res = await fetch(input, originalInit);
  console.debug("[authFetch] resposta inicial status", res.status, input);

  if (res.status !== 401) return res;

  // 401: tentar refresh reativo
  const rt = getRefreshToken();
  if (!rt) {
    clearTokens();
    window.dispatchEvent(new CustomEvent("sessionExpired"));
    return res;
  }

  console.debug("[authFetch] 401 recebido, tentando refresh reativo");
  const newTokens = await refresh(rt).catch(() => null);
  if (newTokens?.accessToken && newTokens?.refreshToken) {
    saveTokens(newTokens.accessToken, newTokens.refreshToken);
    console.debug("[authFetch] refresh reativo bem-sucedido, re-executando requisição");

    const retryInit = init ? { ...init } : {};
    retryInit.headers = {
      ...(retryInit.headers as Record<string, string>),
      "Content-Type": "application/json",
      Authorization: `Bearer ${newTokens.accessToken}`
    };

    return await fetch(input, retryInit);
  }

  // refresh falhou
  clearTokens();
  window.dispatchEvent(new CustomEvent("sessionExpired"));
  console.debug("[authFetch] refresh reativo falhou -> sessão expirada");
  return res;
}