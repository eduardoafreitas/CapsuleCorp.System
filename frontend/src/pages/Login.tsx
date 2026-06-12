import React, { useState } from "react";
import { login, saveTokens } from "../services/api";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setIsError(false);
    setLoading(true);

    try {
      const res = await login({ email, password });
      
      console.log("Debug do retorno normalizado recebido no componente:", res);

      // 💡 CORRIGIDO: Agora confiamos 100% no booleano unificado vindo do api.ts
      if (res && res.success) {
        // Salva os tokens vindos na resposta estruturada
        saveTokens(res.accessToken, res.refreshToken);
        
        setIsError(false);
        setMsg(res.message || "Login bem-sucedido.");
        
        // Mantém o pequeno delay opcional para o usuário ver o feedback visual de sucesso
        setTimeout(() => { 
          onLogin(); 
        }, 1000);
      } else {
        setIsError(true);
        setMsg(res?.message || "E-mail ou senha inválidos.");
      }
    } catch (err) {
      setIsError(true);
      setMsg("Erro ao conectar com a API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" autoComplete="on">
      <h2>Login</h2>
      
      {msg && (
        <div className={isError ? "error" : "success"}>
          {msg}
        </div>
      )}

      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      
      {/* Adicionado o atributo 'required' para evitar submissões vazias à toa */}
      <label htmlFor="login-password">Senha</label>
      <input
        id="login-password"
        name="current-password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? "Aguarde..." : "Entrar"}
      </button>
    </form>
  );
}