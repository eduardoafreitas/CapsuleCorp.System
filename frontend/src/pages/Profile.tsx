import React, { useState } from "react";

export default function Perfil() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Enviando para a API:", { currentPassword, newPassword });
    alert("Senha alterada com sucesso (Simulação)!");
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <div className="profile-container">
      <div className="card">
        <h2>Perfil</h2>
        
        <div className="profile-details">
          <p><strong>Nome:</strong> Eduardo Freitas</p>
          <p><strong>Email:</strong> eduardo.afr@gmail.com</p>
          <p><strong>Status:</strong> <span style={{ color: "var(--success)" }}>Ativa</span></p>
        </div>

        {!isChangingPassword && (
          <button 
            className="btn-secondary" 
            style={{ marginTop: "24px" }}
            onClick={() => setIsChangingPassword(true)}
          >
            🔒 Alterar Senha
          </button>
        )}

        {isChangingPassword && (
          <form className="password-panel" onSubmit={handlePasswordChange}>
            <h3 style={{ color: "var(--text)", fontSize: "1.1rem", marginBottom: "16px" }}>Atualizar Credenciais</h3>
            
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
                Salvar Nova Senha
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