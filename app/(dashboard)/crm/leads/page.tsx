import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadsTable } from "@/components/crm/leads-table";

async function getLeadsData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      leads: [] as {
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        source: string | null;
        status: string;
        assigned_to: string | null;
        notes: string | null;
        created_at: string;
        profiles: { full_name: string } | null;
      }[],
      profiles: [] as { id: string; full_name: string }[],
      companyId: "",
    };
  }

  const [leadsRes, profilesRes] = await Promise.all([
    supabase
      .from("leads")
      .select("id, full_name, email, phone, source, status, assigned_to, notes, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", companyId),
  ]);

  const profilesMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p.full_name])
  );

  const leads = (leadsRes.data ?? []).map((l) => ({
    ...l,
    profiles: l.assigned_to
      ? { full_name: profilesMap.get(l.assigned_to) ?? "-" }
      : null,
  }));

  const profiles = profilesRes.data ?? [];

  return { leads, profiles, companyId };
}

export default async function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
        <p className="text-muted-foreground">
          Manage your leads and track their status
        </p>
      </div>

      <Suspense fallback={<LeadsTableSkeleton />}>
        <LeadsContent />
      </Suspense>
    </div>
  );
}

async function LeadsContent() {
  const { leads, profiles, companyId } = await getLeadsData();

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage leads.
        </p>
      </div>
    );
  }

  return (
    <LeadsTable
      initialLeads={leads}
      profiles={profiles}
      companyId={companyId}
    />
  );
}

function LeadsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
