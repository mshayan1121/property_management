"use client";

import { type ReactNode } from "react";
import { useRole } from "@/hooks/use-role";
import type { PermissionKey } from "@/lib/roles";

interface PermissionGateProps {
  permission: PermissionKey;
  children: ReactNode;
}

/**
 * Renders children only if the current user has the given permission.
 * Use for add/edit/delete buttons and other role-gated UI.
 * Role is provided server-side — no loading delay.
 */
export function PermissionGate({ permission, children }: PermissionGateProps) {
  const { can } = useRole();
  if (!can(permission)) return null;
  return <>{children}</>;
}
