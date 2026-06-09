import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import { getAccessToken, clearTokens } from "./services/api";

export default function App() {
  const [route, setRoute] = useState<"login" | "register" | "profile">(getAccessToken() ? "profile" : "login");
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    function onSessionExpired() {
      setSessionExpired(true);
    }

    window.addEventListener("sessionExpired", onSessionExpired as EventListener);
    return () => window.removeEventListener("sessionExpired", onSessionExpired as EventListener);
  }, []);

  function handleRelogin() {
    clearTokens();
    setSessionExpired(false);
    setRoute("login");
  }

  return (
    <div className="app">
      <header>
        <h1>CapsuleCorp Auth</h1>
        <nav>
          <button onClick={() => setRoute("login")}>Login</button>
          <button onClick={() => setRoute("register")}>Registrar</button>
          <button onClick={() => setRoute("profile")}>Perfil</button>
        </nav>
      </header>

      <main>
        {route === "login" && <Login onLogin={() => setRoute("profile")} />}
        {route === "register" && <Register onRegister={() => setRoute("profile")} />}
        {route === "profile" && <Profile />}
      </main>

      {sessionExpired && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Sessão expirada</h3>
            <p>Seu token expirou. Deseja refazer o login para continuar?</p>
            <div className="modal-actions">
              <button onClick={handleRelogin}>Refazer login</button>
              <button onClick={() => setSessionExpired(false)} className="btn-logout">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}