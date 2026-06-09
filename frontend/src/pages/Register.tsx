import React, { useState } from "react";
import { register, login, saveTokens } from "../services/api";

export default function Register({ onRegister }: { onRegister: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const reg = await register({ name, email, password });
      if (reg?.message) {
        // Tenta logar automaticamente após registro
        const auth = await login({ email, password });
        if (auth?.accessToken && auth?.refreshToken) {
          saveTokens(auth.accessToken, auth.refreshToken);
          onRegister();
        } else {
          setMsg("Registro concluído. Efetue login.");
        }
      } else {
        setMsg(reg?.message ?? "Erro no registro.");
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
      <h2>Registrar</h2>
      {msg && <div className="info">{msg}</div>}
      <label>Nome</label>
      <input value={name} onChange={e => setName(e.target.value)} />
      <label>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <label>Senha</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? "Aguarde..." : "Registrar"}</button>
    </form>
  );
}