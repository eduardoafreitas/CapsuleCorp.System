export type UserRole = "Admin" | "Editor" | "Viewer" | string;

export type Permission = "telemetry:test" | "users:manage";

const permissionRoles: Record<Permission, string[]> = {
  "telemetry:test": ["Admin", "Editor"],
  "users:manage": ["Admin"]
};

export function can(userRoles: UserRole[], permission: Permission) {
  const allowedRoles = permissionRoles[permission];
  return userRoles.some(role => allowedRoles.includes(role));
}
