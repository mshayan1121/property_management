"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/lib/types/supabase";
import { logAudit } from "@/lib/audit";

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
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const users = authUsers?.users ?? [];
  const usersById = new Map(users.map((u: { id: string; email?: string }) => [u.id, u]));
  return (profiles ?? []).map((p: { id: string; full_name: string; role: ProfileRole; created_at: string; status?: string }) => {
    const authUser = usersById.get(p.id);
    return {
      id: p.id,
      email: authUser?.email ?? null,
      full_name: p.full_name,
      role: p.role,
      created_at: p.created_at,
      status: p.status ?? "active",
    };
  });
}

export async function updateUserRole(profileId: string, newRole: ProfileRole) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") return { error: "Forbidden" };
  if (profileId === user.id) return { error: "Cannot change your own role" };
  const admin = createAdminClient();
  const { data: targetProfileData } = await admin.from("profiles").select("full_name, role").eq("id", profileId).single();
  const targetProfile = targetProfileData as { full_name: string; role: string } | null;
  const oldRole = (targetProfile?.role as ProfileRole) ?? null;
  const { error } = await admin
    .from("profiles")
    // @ts-expect-error - Supabase admin client types sometimes infer never for table update
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) return { error: error.message };
  if (myProfile.company_id) {
    await logAudit({
      action: "updated",
      resourceType: "profile",
      resourceId: profileId,
      resourceReference: targetProfile?.full_name ?? profileId,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      companyId: myProfile.company_id,
    });
  }
  return {};
}

export async function setUserStatus(profileId: string, status: "active" | "inactive") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") return { error: "Forbidden" };
  if (profileId === user.id) return { error: "Cannot deactivate yourself" };
  const admin = createAdminClient();
  const { data: targetProfileData } = await admin.from("profiles").select("full_name, status").eq("id", profileId).single();
  const targetProfile = targetProfileData as { full_name: string; status?: string } | null;
  const oldStatus = targetProfile?.status ?? null;
  const { error } = await admin
    .from("profiles")
    // @ts-expect-error - Supabase admin client types sometimes infer never for table update
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) return { error: error.message };
  if (myProfile.company_id) {
    await logAudit({
      action: "updated",
      resourceType: "profile",
      resourceId: profileId,
      resourceReference: targetProfile?.full_name ?? profileId,
      oldValues: { status: oldStatus },
      newValues: { status },
      companyId: myProfile.company_id,
    });
  }
  return {};
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
    // @ts-expect-error - Supabase admin client types sometimes infer never for table upsert
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
