"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/lib/types/supabase";

export type UserWithProfile = {
  id: string;
  email: string | null;
  full_name: string;
  role: ProfileRole;
  created_at: string;
  status: string;
};

export async function getUsersForAdmin(): Promise<UserWithProfile[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    redirect("/unauthorized");
  }
  const admin = createAdminClient();
  const companyId = profile.company_id;
  if (!companyId) {
    return [];
  }
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role, created_at, status")
    .eq("company_id", companyId);
  const { data: authUsers } = await admin.auth.admin.listUsers({ per_page: 1000 });
  const usersById = new Map(authUsers.users.map((u) => [u.id, u]));
  return (profiles ?? []).map((p) => {
    const authUser = usersById.get(p.id);
    return {
      id: p.id,
      email: authUser?.email ?? null,
      full_name: p.full_name,
      role: p.role,
      created_at: p.created_at,
      status: (p as { status?: string }).status ?? "active",
    };
  });
}

export async function updateUserRole(profileId: string, newRole: ProfileRole) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") return { error: "Forbidden" };
  if (profileId === user.id) return { error: "Cannot change your own role" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  return error ? { error: error.message } : {};
}

export async function setUserStatus(profileId: string, status: "active" | "inactive") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") return { error: "Forbidden" };
  if (profileId === user.id) return { error: "Cannot deactivate yourself" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  return error ? { error: error.message } : {};
}

const DEFAULT_INVITE_PASSWORD = "Jetset@1234";

export async function inviteUser(email: string, fullName: string, role: ProfileRole) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") return { error: "Forbidden" };
  const admin = createAdminClient();
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_INVITE_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });
  if (createError) return { error: createError.message };
  if (createData?.user?.id && myProfile.company_id) {
    await admin.from("profiles").upsert({
      id: createData.user.id,
      full_name: fullName,
      role,
      company_id: myProfile.company_id,
      status: "active",
      must_change_password: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
  }
  return { defaultPassword: DEFAULT_INVITE_PASSWORD };
}
