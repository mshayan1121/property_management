"use client";

import { useRoleContext } from "@/components/shared/role-provider";
import type { PermissionKey } from "@/lib/roles";

type RoleState = {
  role: ReturnType<typeof useRoleContext>["role"];
  loading: false;
  error: null;
  can: (permission: PermissionKey) => boolean;
};

/**
 * Returns the current user's role and permission check.
 * Role is provided server-side via RoleProvider — available instantly, no loading state.
 */
export function useRole(): RoleState {
  const { role, can } = useRoleContext();
  return {
    role,
    loading: false,
    error: null,
    can,
  };
}
