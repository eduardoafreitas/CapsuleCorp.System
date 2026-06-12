﻿import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import { clearTokens } from "./services/api";
import { fetchWithAuth } from "./services/authFetch";

export default function App() {
  const [route, setRoute] = useState<"login" | "register" | "profile" | "dashboard" | "loading">("loading");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]); // 💡 Estado novo: Armazena a lista de roles do usuário

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
      try {
        const res = await fetchWithAuth("/api/Auth/me");
        if (res.ok) {
          const userData = await res.json();
          // 💡 Captura o array de roles retornado do backend e salva no estado
          setUserRoles(userData.roles || []);
          setRoute("dashboard"); // Usuário logado cai direto no Dashboard com segurança
        } else {
          clearTokens();
          setUserRoles([]);
          setRoute("login");
        }
      } catch {
        clearTokens();
        setUserRoles([]);
        setRoute("login");
      }
    }
    checkSession();
  }, []);

  // Ouvinte para sessão expirada (Event disparado pelo interceptor/fetch)
  useEffect(() => {
    function onSessionExpired() {
      setSessionExpired(true);
    }
    window.addEventListener("sessionExpired", onSessionExpired as EventListener);
    return () => window.removeEventListener("sessionExpired", onSessionExpired as EventListener);
  }, []);

  // Executa o Logout Limpando a Sessão de forma segura
  async function handleLogout() {
    try {
      await fetchWithAuth("/api/Auth/logout", { method: "POST" }).catch(() => null);
    } finally {
      clearTokens(); // Remove os tokens do localStorage
      setUserRoles([]); // Limpa as roles do estado
      setSessionExpired(false); // Garante que fecha o modal se estiver aberto
      setRoute("login"); // Joga o usuário de volta para o Login
    }
  }

  function handleRelogin() {
    clearTokens();
    setUserRoles([]);
    setSessionExpired(false);
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
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          style={{ fontSize: '1.2rem', padding: '0 12px' }}
        >
          {theme === 'dark' ? '💡' : '🌙'}
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
            <button className={route === "dashboard" ? "active" : ""} onClick={() => setRoute("dashboard")}>Dashboard</button>
            <button className={route === "profile" ? "active" : ""} onClick={() => setRoute("profile")}>Perfil</button>
            <button onClick={handleLogout} className="btn-logout">
              Sair
            </button>
          </>
        )}
      </nav>
    </header>

    {/* SUB-MENU: Botão na posição idêntica à original */}
    {isUserLoggedIn && route === "dashboard" && (
      <div style={{ display: "flex", justifyContent: "flex-end", maxWidth: "800px", margin: "-1.5rem auto 1.5rem auto" }}>
        
        {/* 💡 Regra de negócio: O botão de testes só aparece para Admin ou Editor */}
        {(userRoles.includes("Admin") || userRoles.includes("Editor")) && (
          <button className="btn-secondary" onClick={() => alert("Testando conexão...")}>
            🔧 Testar Tela de Conexão
          </button>
        )}
        
      </div>
    )}
    
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
      {route === "login" && <Login onLogin={() => { setSessionExpired(false); setRoute("dashboard"); }} />}
      {route === "register" && <Register onRegister={() => { setSessionExpired(false); setRoute("dashboard"); }} />}
      {route === "profile" && <Profile />}
      {route === "dashboard" && <Dashboard />}
    </main>
  </div>
);
}