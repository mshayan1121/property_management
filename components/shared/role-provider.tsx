"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { UserRole, PermissionKey } from "@/lib/roles";
import { hasPermission } from "@/lib/roles";

type RoleContextValue = {
  role: UserRole;
  can: (permission: PermissionKey) => boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const DEFAULT_ROLE: UserRole = "viewer";

interface RoleProviderProps {
  role: UserRole | null;
  children: ReactNode;
}

/**
 * Provides the current user's role from the server to the tree.
 * Role is fetched in the dashboard layout and passed here — no client fetch, no loading delay.
 */
export function RoleProvider({ role, children }: RoleProviderProps) {
  const effectiveRole = role ?? DEFAULT_ROLE;
  const can = useCallback(
    (permission: PermissionKey) => hasPermission(effectiveRole, permission),
    [effectiveRole]
  );
  const value = useMemo<RoleContextValue>(
    () => ({ role: effectiveRole, can }),
    [effectiveRole, can]
  );

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRoleContext(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    return {
      role: DEFAULT_ROLE,
      can: (permission: PermissionKey) =>
        hasPermission(DEFAULT_ROLE, permission),
    };
  }
  return ctx;
}
