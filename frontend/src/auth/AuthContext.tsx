import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearTokens } from "../services/api";
import { fetchWithAuth } from "../services/authFetch";
import type { UserRole } from "./permissions";

type AuthContextValue = {
  userRoles: UserRole[];
  sessionExpired: boolean;
  setSessionExpired: (value: boolean) => void;
  hydrateAuthenticatedSession: (fallbackRoles?: UserRole[]) => Promise<boolean>;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSession = useCallback(() => {
    clearTokens();
    setUserRoles([]);
    setSessionExpired(false);
  }, []);

  const hydrateAuthenticatedSession = useCallback(async (fallbackRoles: UserRole[] = []) => {
    try {
      const res = await fetchWithAuth("/api/Auth/me");

      if (res.ok) {
        const userData = await res.json();
        setSessionExpired(false);
        setUserRoles(Array.isArray(userData.roles) ? userData.roles : []);
        return true;
      }
    } catch {
      // The login/register response can still hydrate roles if /me is temporarily unavailable.
    }

    if (fallbackRoles.length > 0) {
      setSessionExpired(false);
      setUserRoles(fallbackRoles);
      return true;
    }

    clearSession();
    return false;
  }, [clearSession]);

  useEffect(() => {
    function onSessionExpired() {
      setSessionExpired(true);
    }

    window.addEventListener("sessionExpired", onSessionExpired as EventListener);
    return () => window.removeEventListener("sessionExpired", onSessionExpired as EventListener);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    userRoles,
    sessionExpired,
    setSessionExpired,
    hydrateAuthenticatedSession,
    clearSession
  }), [clearSession, hydrateAuthenticatedSession, sessionExpired, userRoles]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
