export type UserRole = "Admin" | "Editor" | "Viewer" | string;

export type Permission = "telemetry:test";

const permissionRoles: Record<Permission, string[]> = {
  "telemetry:test": ["Admin", "Editor"]
};

export function can(userRoles: UserRole[], permission: Permission) {
  const allowedRoles = permissionRoles[permission];
  return userRoles.some(role => allowedRoles.includes(role));
}
