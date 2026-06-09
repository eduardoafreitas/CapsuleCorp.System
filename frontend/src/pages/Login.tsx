import React, { useState } from "react";
import { login, saveTokens } from "../services/api";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      // suporta vários formatos de resposta graças a normalizeAuthResponse
      if (res?.accessToken) {
        saveTokens(res.accessToken, res.refreshToken ?? null);
        onLogin();
      } else {
        setMsg(res?.message ?? "Falha ao autenticar.");
        console.debug("Login response (raw):", res?.raw ?? res);
      }
    } catch (err) {
      setMsg("Erro ao conectar com a API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Login</h2>
      {msg && <div className="error">{msg}</div>}
      <label>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <label>Senha</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? "Aguarde..." : "Entrar"}</button>
    </form>
  );
}