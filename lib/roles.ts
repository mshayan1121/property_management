export type UserRole = "admin" | "manager" | "agent" | "viewer";

export const ROLE_PERMISSIONS = {
  admin: {
    canAccessSettings: true,
    canManageUsers: true,
    canAccessCRM: true,
    canAccessProperties: true,
    canAccessAccounts: true,
    canAccessOperations: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  manager: {
    canAccessSettings: false,
    canManageUsers: false,
    canAccessCRM: true,
    canAccessProperties: true,
    canAccessAccounts: true,
    canAccessOperations: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  agent: {
    canAccessSettings: false,
    canManageUsers: false,
    canAccessCRM: true,
    canAccessProperties: false,
    canAccessAccounts: false,
    canAccessOperations: false,
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  viewer: {
    canAccessSettings: false,
    canManageUsers: false,
    canAccessCRM: true,
    canAccessProperties: true,
    canAccessAccounts: true,
    canAccessOperations: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
} as const;

export type PermissionKey = keyof (typeof ROLE_PERMISSIONS)["admin"];

export function hasPermission(
  role: UserRole,
  permission: PermissionKey
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
