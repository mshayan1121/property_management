import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditLogClient } from "./audit-log-client";
import { format } from "date-fns";

const DEFAULT_PAGE_SIZE = 10;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; resource_type?: string; from?: string; to?: string; q?: string; page?: string; pageSize?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || !profile.company_id) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const action = params.action ?? "";
  const resourceType = params.resource_type ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";
  const q = (params.q ?? "").trim();
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(params.pageSize ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));

  let query = supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_reference, user_email, created_at, old_values, new_values", { count: "exact" })
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (action) query = query.eq("action", action);
  if (resourceType) query = query.eq("resource_type", resourceType);
  if (from) query = query.gte("created_at", `${from}T00:00:00Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);
  if (q) {
    query = query.or(`user_email.ilike.%${q}%,resource_reference.ilike.%${q}%`);
  }

  const fromRow = (page - 1) * pageSize;
  query = query.range(fromRow, fromRow + pageSize - 1);

  const { data: rows, error, count } = await query;

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Audit Log</h2>
        <p className="text-destructive">Failed to load audit log: {error.message}</p>
      </div>
    );
  }

  const items = (rows ?? []).map((r) => ({
    id: r.id,
    action: r.action,
    resource_type: r.resource_type,
    resource_reference: r.resource_reference ?? "—",
    user_email: r.user_email ?? "—",
    created_at: format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
    old_values: r.old_values as Record<string, unknown> | null,
    new_values: r.new_values as Record<string, unknown> | null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
        <p className="text-muted-foreground">View create, update, and delete activity (Admin only)</p>
      </div>
      <AuditLogClient
        items={items}
        totalCount={count ?? 0}
        currentPage={page}
        pageSize={pageSize}
        filters={{ action, resource_type: resourceType, from, to, q }}
      />
    </div>
  );
}
