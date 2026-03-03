import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { MaintenanceTable } from "@/components/operations/maintenance-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type MaintenanceSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  property?: string;
};

type MaintenanceRow = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  property_id: string | null;
  property_name: string | null;
  unit_id: string | null;
  unit_number: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  category: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  estimated_cost: number;
  actual_cost: number;
};

async function getMaintenanceData(searchParams: MaintenanceSearchParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      requests: [] as MaintenanceRow[],
      properties: [] as { id: string; reference: string; name: string }[],
      units: [] as { id: string; unit_number: string; property_id: string }[],
      tenants: [] as { id: string; full_name: string; reference: string }[],
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
  const statusFilter = searchParams.status ?? "all";
  const categoryFilter = searchParams.category ?? "all";
  const priorityFilter = searchParams.priority ?? "all";
  const propertyFilter = searchParams.property ?? "all";

  let query = supabase
    .from("maintenance_requests")
    .select("id, reference, title, description, property_id, unit_id, tenant_id, category, priority, status, assigned_to, estimated_cost, actual_cost", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,reference.ilike.%${search}%`);
  }
  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (categoryFilter !== "all") query = query.eq("category", categoryFilter);
  if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
  if (propertyFilter !== "all") query = query.eq("property_id", propertyFilter);

  const [requestsRes, propertiesRes, unitsRes, tenantsRes, profilesRes] =
    await Promise.all([
      query.range(from, to),
      supabase.from("properties").select("id, reference, name").eq("company_id", companyId),
      supabase.from("units").select("id, unit_number, property_id").eq("company_id", companyId),
      supabase.from("tenants").select("id, full_name, reference").eq("company_id", companyId),
      supabase.from("profiles").select("id, full_name").eq("company_id", companyId),
    ]);

  const count = requestsRes.count ?? 0;
  const propertiesMap = new Map(
    (propertiesRes.data ?? []).map((p) => [p.id, p.name])
  );
  const unitsMap = new Map(
    (unitsRes.data ?? []).map((u) => [u.id, u.unit_number])
  );
  const tenantsMap = new Map(
    (tenantsRes.data ?? []).map((t) => [t.id, t.full_name])
  );

  const requests: MaintenanceRow[] = (requestsRes.data ?? []).map((r) => ({
    ...r,
    estimated_cost: Number(r.estimated_cost),
    actual_cost: Number(r.actual_cost),
    property_name: r.property_id ? propertiesMap.get(r.property_id) ?? null : null,
    unit_number: r.unit_id ? unitsMap.get(r.unit_id) ?? null : null,
    tenant_name: r.tenant_id ? tenantsMap.get(r.tenant_id) ?? null : null,
  }));

  return {
    requests,
    properties: propertiesRes.data ?? [],
    units: unitsRes.data ?? [],
    tenants: (tenantsRes.data ?? []).map((t) => ({
      id: t.id,
      full_name: t.full_name,
      reference: t.reference,
    })),
    profiles: profilesRes.data ?? [],
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

function MaintenanceTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<MaintenanceSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Maintenance Requests
          </h2>
          <p className="text-muted-foreground">
            Track and manage maintenance requests
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<MaintenanceTableSkeleton />}>
          <MaintenanceContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function MaintenanceContent({ params }: { params: MaintenanceSearchParams }) {
  const {
    requests,
    companyId,
    properties,
    units,
    tenants,
    profiles,
    totalCount,
    page,
    pageSize,
  } = await getMaintenanceData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage maintenance requests.
        </p>
      </div>
    );
  }

  return (
    <MaintenanceTable
      initialRequests={requests}
      companyId={companyId}
      properties={properties}
      units={units}
      tenants={tenants}
      profiles={profiles}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        status: params.status ?? "all",
        category: params.category ?? "all",
        priority: params.priority ?? "all",
        property: params.property ?? "all",
      }}
    />
  );
}
