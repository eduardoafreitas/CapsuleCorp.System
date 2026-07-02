import React, { useEffect, useState } from "react";
import { listAdminUsers, updateAdminUserRoles, type AdminUser } from "../services/adminUsersApi";

const AVAILABLE_ROLES = ["Admin", "Editor", "Viewer"];

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listAdminUsers()
      .then(data => {
        if (isMounted) setUsers(data);
      })
      .catch(error => {
        console.error(error);
        if (isMounted) {
          setIsError(true);
          setMessage("Nao foi possivel carregar usuarios.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRoleToggle(user: AdminUser, role: string) {
    const nextRoles = user.roles.includes(role)
      ? user.roles.filter(currentRole => currentRole !== role)
      : [...user.roles, role];

    if (nextRoles.length === 0) {
      setIsError(true);
      setMessage("Cada usuario precisa manter ao menos uma role.");
      return;
    }

    setSavingUserId(user.id);
    setMessage(null);

    try {
      await updateAdminUserRoles(user.id, nextRoles);

      setUsers(currentUsers => currentUsers.map(currentUser => (
        currentUser.id === user.id
          ? { ...currentUser, roles: nextRoles.sort() }
          : currentUser
      )));

      setIsError(false);
      setMessage("Roles atualizadas. O usuario alterado deve refazer login para receber um novo token.");
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage("Nao foi possivel atualizar as roles.");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="admin-users-container">
      <div className="dashboard-header">
        <div>
          <h2>Usuarios e Roles</h2>
          <div className="status-badge">
            Gerencie permissoes sem editar o banco manualmente.
          </div>
        </div>
      </div>

      {message && (
        <div className={isError ? "error" : "success"}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="info-box">
          <p>Carregando usuarios...</p>
        </div>
      ) : (
        <div className="admin-users-list">
          {users.map(user => (
            <div className="admin-user-row" key={user.id}>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>

              <div className="role-toggle-group">
                {AVAILABLE_ROLES.map(role => (
                  <label key={role} className="role-toggle">
                    <input
                      checked={user.roles.includes(role)}
                      disabled={savingUserId === user.id}
                      onChange={() => handleRoleToggle(user, role)}
                      type="checkbox"
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
