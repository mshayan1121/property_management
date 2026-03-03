import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkOrdersTable } from "@/components/operations/work-orders-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type WorkOrdersSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
  vendor?: string;
};

type WorkOrderRow = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  maintenance_request_id: string | null;
  maintenance_request_ref: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  estimated_cost: number;
  actual_cost: number;
};

async function getWorkOrdersData(searchParams: WorkOrdersSearchParams) {
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
      workOrders: [] as WorkOrderRow[],
      maintenanceRequests: [] as { id: string; reference: string; title: string }[],
      vendors: [] as { id: string; name: string }[],
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
  const vendorFilter = searchParams.vendor ?? "all";

  let query = supabase
    .from("work_orders")
    .select("id, reference, title, description, maintenance_request_id, vendor_id, assigned_to, status, scheduled_date, completed_date, estimated_cost, actual_cost", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,reference.ilike.%${search}%`);
  }
  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (vendorFilter !== "all") query = query.eq("vendor_id", vendorFilter);

  const [woRes, mrRes, vendorsRes, profilesRes] = await Promise.all([
    query.range(from, to),
    supabase.from("maintenance_requests").select("id, reference, title").eq("company_id", companyId),
    supabase.from("vendors").select("id, name").eq("company_id", companyId),
    supabase.from("profiles").select("id, full_name").eq("company_id", companyId),
  ]);

  const count = woRes.count ?? 0;
  const mrMap = new Map((mrRes.data ?? []).map((m) => [m.id, m.reference]));
  const vendorsMap = new Map((vendorsRes.data ?? []).map((v) => [v.id, v.name]));
  const profileIds = [...new Set((woRes.data ?? []).map((w) => w.assigned_to).filter((id): id is string => !!id))];
  const { data: profilesData } = profileIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] };
  const profilesMap = new Map((profilesData ?? []).map((p) => [p.id, p.full_name]));

  const workOrders: WorkOrderRow[] = (woRes.data ?? []).map((w) => ({
    ...w,
    estimated_cost: Number(w.estimated_cost),
    actual_cost: Number(w.actual_cost),
    maintenance_request_ref: w.maintenance_request_id ? mrMap.get(w.maintenance_request_id) ?? null : null,
    vendor_name: w.vendor_id ? vendorsMap.get(w.vendor_id) ?? null : null,
    assigned_name: w.assigned_to ? profilesMap.get(w.assigned_to) ?? null : null,
  }));

  return {
    workOrders,
    maintenanceRequests: (mrRes.data ?? []).map((m) => ({ id: m.id, reference: m.reference, title: m.title })),
    vendors: vendorsRes.data ?? [],
    profiles: profilesRes.data ?? [],
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

function WorkOrdersTableSkeleton() {
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

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<WorkOrdersSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Work Orders</h2>
          <p className="text-muted-foreground">
            Manage work orders and vendor assignments
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<WorkOrdersTableSkeleton />}>
          <WorkOrdersContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function WorkOrdersContent({ params }: { params: WorkOrdersSearchParams }) {
  const { workOrders, companyId, maintenanceRequests, vendors, profiles, totalCount, page, pageSize } =
    await getWorkOrdersData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage work orders.
        </p>
      </div>
    );
  }

  return (
    <WorkOrdersTable
      initialWorkOrders={workOrders}
      companyId={companyId}
      maintenanceRequests={maintenanceRequests}
      vendors={vendors}
      profiles={profiles}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        status: params.status ?? "all",
        vendor: params.vendor ?? "all",
      }}
    />
  );
}
