"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuditAction = "created" | "updated" | "deleted" | "viewed";

export type AuditResourceType =
  | "lead"
  | "deal"
  | "contact"
  | "contract"
  | "property"
  | "unit"
  | "tenant"
  | "invoice"
  | "payment"
  | "bill"
  | "vendor"
  | "project"
  | "task"
  | "maintenance"
  | "work_order"
  | "announcement"
  | "profile";

export interface AuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  resourceReference?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  companyId: string;
  ipAddress?: string | null;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user
    ? await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()
    : { data: null };
  const companyId = profile?.data?.company_id ?? params.companyId;
  if (companyId !== params.companyId) {
    return;
  }
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    params.ipAddress ??
    null;

  await supabase.from("audit_logs").insert({
    user_id: params.userId ?? user?.id ?? null,
    user_email: params.userEmail ?? user?.email ?? null,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    resource_reference: params.resourceReference ?? null,
    old_values: params.oldValues ?? null,
    new_values: params.newValues ?? null,
    company_id: companyId,
    ip_address: ip,
  });
}
