"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole, PermissionKey } from "@/lib/roles";
import { hasPermission } from "@/lib/roles";

type RoleState = {
  role: UserRole | null;
  loading: boolean;
  error: string | null;
};

const DEFAULT_ROLE: UserRole = "viewer";

export function useRole() {
  const [state, setState] = useState<RoleState>({
    role: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        setState({ role: null, loading: false, error: null });
        return;
      }
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        setState({
          role: DEFAULT_ROLE,
          loading: false,
          error: error.message,
        });
        return;
      }
      const role = (profile?.role as UserRole) ?? DEFAULT_ROLE;
      setState({ role, loading: false, error: null });
    }

    load();
  }, []);

  const can = useCallback(
    (permission: PermissionKey): boolean => {
      const role = state.role ?? DEFAULT_ROLE;
      return hasPermission(role, permission);
    },
    [state.role]
  );

  return {
    role: state.role ?? DEFAULT_ROLE,
    loading: state.loading,
    error: state.error,
    can,
  };
}
