import { headers } from "./api";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:5001";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

type AdminUsersResponse = {
  data?: AdminUser[];
  Data?: AdminUser[];
};

export async function listAdminUsers() {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    method: "GET",
    headers: headers()
  });

  if (!res.ok) {
    throw new Error("Nao foi possivel listar usuarios.");
  }

  const payload = await res.json() as AdminUsersResponse;
  return payload.data ?? payload.Data ?? [];
}

export async function updateAdminUserRoles(userId: string, roles: string[]) {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/roles`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ roles })
  });

  if (!res.ok) {
    throw new Error("Nao foi possivel atualizar as roles do usuario.");
  }

  return await res.json();
}
