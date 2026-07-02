import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import { Icon } from "./components/Icon";
import { useAuth } from "./auth/AuthContext";
import { fetchWithAuth } from "./services/authFetch";

export default function App() {
  const [route, setRoute] = useState<"login" | "register" | "profile" | "dashboard" | "loading">("loading");
  const { userRoles, sessionExpired, setSessionExpired, hydrateAuthenticatedSession, clearSession } = useAuth();

  // ==========================================================================
  // LÓGICA DO TEMA (Executada imediatamente ao carregar o componente)
  // ==========================================================================
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('@CapsuleCorp:theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('@CapsuleCorp:theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };
  // ==========================================================================

  // Validação inicial ao carregar o App (F5) ou abrir o sistema
  useEffect(() => {
    async function checkSession() {
      
      if (route === "login") {
      clearSession();
      return;
      } 
      
      const isAuthenticated = await hydrateAuthenticatedSession();
      setRoute(isAuthenticated ? "dashboard" : "login");
    }
    checkSession();
  }, [clearSession, hydrateAuthenticatedSession]);

  // Executa o Logout Limpando a Sessão de forma segura
  async function handleLogout() {
    try {
      await fetchWithAuth("/api/Auth/logout", { method: "POST" }).catch(() => null);
    } finally {
      clearSession(); // Remove tokens e estado autenticado
      setRoute("login"); // Joga o usuário de volta para o Login
    }
  }

  function handleRelogin() {
    clearSession();
    setRoute("login");
  }

  if (route === "loading") {
    return (
      <div className="app" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--bg)" }}>
        <p style={{ color: "var(--accent-2)", fontSize: "1.2rem", fontWeight: "600" }}>Validando sessão segura...</p>
      </div>
    );
  }

  // Define se o usuário está em um estado autenticado para simplificar as condicionais
  const isUserLoggedIn = route === "dashboard" || route === "profile";

  return (
    <div className="app">
      <header>
        <h1>
          CapsuleCorp System
          {/* Marcador sutil integrado com a classe de estilo do ecossistema */}
          {isUserLoggedIn && userRoles.length > 0 && (
            <span className="user-role-tag">
              [{userRoles.join(", ")}]
            </span>
          )}
        </h1>
        <nav>
          {/* BOTÃO DO TEMA SEMPRE VISÍVEL (Independente de estar logado ou não) */}
          <button
            className="icon-button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            aria-label={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>

          {/* Se o usuário NÃO está logado, mostra APENAS Login e Cadastrar */}
          {!isUserLoggedIn && (
            <>
              <button className={route === "login" ? "active" : ""} onClick={() => setRoute("login")}>Login</button>
              <button className={route === "register" ? "active" : ""} onClick={() => setRoute("register")}>Cadastrar</button>
            </>
          )}

          {/* Se o usuário ESTIVER logado, mostra Dashboard, Perfil e Sair */}
          {isUserLoggedIn && (
            <>
              <button className={route === "dashboard" ? "active" : ""} onClick={() => setRoute("dashboard")}>
                <Icon name="activity" />
                Dashboard
              </button>
              <button className={route === "profile" ? "active" : ""} onClick={() => setRoute("profile")}>
                <Icon name="user" />
                Perfil
              </button>
              <button onClick={handleLogout} className="btn-logout">
                <Icon name="logOut" />
                Sair
              </button>
            </>
          )}
        </nav>
      </header>

      {sessionExpired && (
        <div className="session-expired">
          <h3>Sessão expirada</h3>
          <p>Seu token expirou. Deseja refazer o login para continuar?</p>
          <div className="button-group">
            <button onClick={handleRelogin}>Refazer login</button>
            <button onClick={() => setSessionExpired(false)} className="btn-secondary">Fechar</button>
          </div>
        </div>
      )}

      <main>
        {/* Ao fazer login ou cadastrar com sucesso, jogamos o usuário direto para o Dashboard */}
        {route === "login" && (
          <Login
            onLogin={(roles: string[]) => {
              hydrateAuthenticatedSession(roles || []).then(isAuthenticated => {
                setRoute(isAuthenticated ? "dashboard" : "login");
              });
            }}
          />
        )}
        {route === "register" && (
          <Register
            onRegister={(roles: string[]) => {
              hydrateAuthenticatedSession(roles || []).then(isAuthenticated => {
                setRoute(isAuthenticated ? "dashboard" : "login");
              });
            }}
          />
        )}
        {route === "profile" && <Profile />}
        {route === "dashboard" && <Dashboard />}
      </main>
    </div>
  );
}
