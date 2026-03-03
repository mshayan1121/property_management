import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadsTable } from "@/components/crm/leads-table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type LeadsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  source?: string;
  status?: string;
};

async function getLeadsData(searchParams: LeadsSearchParams) {
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
      totalCount: 0,
      page: 1,
      pageSize: 10,
    };
  }

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize ?? "10", 10) || 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = (searchParams.search ?? "").trim();
  const source = searchParams.source ?? "all";
  const status = searchParams.status ?? "all";

  let query = supabase
    .from("leads")
    .select("id, full_name, email, phone, source, status, assigned_to, notes, created_at", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (source !== "all") {
    query = query.eq("source", source);
  }
  if (status !== "all") {
    query = query.eq("status", status);
  }

  const [leadsRes, profilesRes] = await Promise.all([
    query.range(from, to),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", companyId),
  ]);

  const count = leadsRes.count ?? 0;
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

  return { leads, profiles, companyId, totalCount: count, page, pageSize };
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<LeadsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">
            Manage your leads and track their status
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={10} columns={8} />}>
          <LeadsContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function LeadsContent({ params }: { params: LeadsSearchParams }) {
  const { leads, profiles, companyId, totalCount, page, pageSize } = await getLeadsData(params);

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
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{ search: params.search ?? "", source: params.source ?? "all", status: params.status ?? "all" }}
    />
  );
}
