import React, { useState } from "react";
import { register, login, saveTokens } from "../services/api";

export default function Register({ onRegister }: { onRegister: () => void }) {
  const [name, setName] = useState("");
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
      // 1. Tenta registrar o usuário no backend
      const reg = await register({ name, email, password });
      
      // Se a API retornar uma flag explícita de erro
      if (reg?.success === false) {
        setIsError(true);
        setMsg(reg.message || "Erro ao tentar registrar o usuário.");
        setLoading(false);
        return;
      }

      // 2. Se não deu erro, tenta logar automaticamente para poupar tempo do usuário
      const auth = await login({ email, password });
      
      if (auth && auth.success) {
        saveTokens(auth.accessToken, auth.refreshToken);
        
        setIsError(false);
        setMsg("Registro e login bem-sucedidos!");
        
        // Delay visual antes de redirecionar para o Dashboard
        setTimeout(() => {
          onRegister();
        }, 1000);
      } else {
        // O registro deu certo, mas o login automático falhou por algum motivo
        setIsError(false); 
        setMsg("Registro concluído com sucesso. Por favor, efetue o login manualmente.");
      }
    } catch (err) {
      setIsError(true);
      setMsg("Erro ao conectar com a API de registro.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" autoComplete="on">
      <h2>Registrar</h2>
      
      {/* CORRIGIDO: Mensagens de feedback agora usam as mesmas classes do Login */}
      {msg && (
        <div className={isError ? "error" : "success"}>
          {msg}
        </div>
      )}

      <label htmlFor="reg-name">Nome</label>
      <input
        id="reg-name"
        name="name"
        autoComplete="name"
        required
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <label htmlFor="reg-email">Email</label>
      <input
        id="reg-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <label htmlFor="reg-password">Senha</label>
      <input
        id="reg-password"
        name="new-password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Aguarde..." : "Registrar"}
      </button>
    </form>
  );
}