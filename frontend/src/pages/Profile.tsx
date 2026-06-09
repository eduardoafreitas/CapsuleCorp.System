import React, { useEffect, useState } from "react";
import { getAccessToken, clearTokens } from "../services/api";
import { fetchWithAuth } from "../services/authFetch";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:5001";

export default function Profile() {
  const token = getAccessToken();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const res = await fetchWithAuth(`${API_BASE}/api/Auth/me`);
        if (!res.ok) {
          setMsg("Falha ao obter dados do usuário.");
          return;
        }
        const data = await res.json();
        setName(data.name ?? "");
        setEmail(data.email ?? "");
      } catch (err) {
        setMsg("Erro ao conectar com a API.");
        console.error(err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) return <div className="card">Não autenticado.</div>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/Auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, currentPassword, newPassword })
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg(body?.message ?? "Erro ao atualizar perfil.");
      } else {
        setMsg(body?.message ?? "Perfil atualizado.");
      }
    } catch (err) {
      setMsg("Erro ao conectar com a API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Perfil</h2>
      {msg && <div className="info">{msg}</div>}
      <form onSubmit={handleSubmit}>
        <label>Nome</label>
        <input value={name} onChange={e => setName(e.target.value)} />
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />
        <label>Senha atual (para trocar)</label>
        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        <label>Nova senha</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? "Aguarde..." : "Atualizar"}</button>
      </form>
      <button className="btn-logout" onClick={() => { clearTokens(); window.location.reload(); }}>Sair</button>
    </div>
  );
}