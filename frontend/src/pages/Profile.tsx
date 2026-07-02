import React, { useState, useEffect } from "react";
import { Icon } from "../components/Icon";
import { getMe } from "../services/api";

// Interface para tipar os dados do usuário que vêm da API .NET
interface UserData {
  name?: string;
  email?: string;
}

export default function Perfil() {
  // Estados para os dados dinâmicos da API
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Seus estados originais do formulário de senha
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // useEffect que roda assim que o componente é montado na tela
  useEffect(() => {
    async function carregarPerfil() {
      try {
        const dadosDoUsuario = await getMe();
        if (dadosDoUsuario) {
          setUser(dadosDoUsuario);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do perfil no front:", error);
      } finally {
        setLoading(false); // Desativa o indicador de carregamento
      }
    }

    carregarPerfil();
  }, []);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Enviando para a API:", { currentPassword, newPassword });
    alert("Senha alterada com sucesso (Simulação)!");
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
  };

  // Tela de transição enquanto a API responde
  if (loading) {
    return (
      <div className="profile-container">
        <div className="card">
          <h2>Perfil</h2>
          <p style={{ color: "var(--text)" }}>Buscando dados do servidor...</p>
        </div>
      </div>
    );
  }

  // Caso aconteça algum erro ou o token seja inválido
  if (!user) {
    return (
      <div className="profile-container">
        <div className="card">
          <h2>Perfil</h2>
          <p style={{ color: "red" }}>Não foi possível carregar o perfil. Faça login novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="card">
        <h2>Perfil</h2>
        
        <div className="profile-details">
          {/* Pegando as propriedades dinâmicas do objeto 'user' */}
          <p><strong>Nome:</strong> {user.name ?? "Nome não encontrado"}</p>
          <p><strong>Email:</strong> {user.email ?? "Email não encontrado"}</p>
          <p><strong>Status:</strong> <span style={{ color: "var(--success)" }}>Ativa</span></p>
        </div>

        {!isChangingPassword && (
          <button 
            className="btn-secondary" 
            style={{ marginTop: "24px" }}
            onClick={() => setIsChangingPassword(true)}
          >
            <Icon name="lock" />
            Alterar Senha
          </button>
        )}

        {isChangingPassword && (
          <form className="password-panel" onSubmit={handlePasswordChange}>
            <h3 style={{ color: "var(--text)", fontSize: "1.1rem", marginBottom: "16px" }}>Analisar Credenciais</h3>
            
            <label>Senha Atual</label>
            <input 
              type="password" 
              placeholder="Digite sua senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <label>Nova Senha</label>
            <input 
              type="password" 
              placeholder="Digite a nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <div className="password-panel-actions">
              <button type="submit" className="btn-primary" style={{ marginTop: "0" }}>
                Salvar nova senha
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setIsChangingPassword(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
