import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkOrdersTable } from "@/components/operations/work-orders-table";

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

async function getWorkOrdersData() {
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
    };
  }

  const [woRes, mrRes, vendorsRes, profilesRes] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id, reference, title, description, maintenance_request_id, vendor_id, assigned_to, status, scheduled_date, completed_date, estimated_cost, actual_cost")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("maintenance_requests")
      .select("id, reference, title")
      .eq("company_id", companyId),
    supabase
      .from("vendors")
      .select("id, name")
      .eq("company_id", companyId),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", companyId),
  ]);

  const mrMap = new Map(
    (mrRes.data ?? []).map((m) => [m.id, m.reference])
  );
  const vendorsMap = new Map(
    (vendorsRes.data ?? []).map((v) => [v.id, v.name])
  );
  const profileIds = [
    ...new Set(
      (woRes.data ?? [])
        .map((w) => w.assigned_to)
        .filter((id): id is string => !!id)
    ),
  ];
  const { data: profilesData } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds)
      : { data: [] };
  const profilesMap = new Map(
    (profilesData ?? []).map((p) => [p.id, p.full_name])
  );

  const workOrders: WorkOrderRow[] = (woRes.data ?? []).map((w) => ({
    ...w,
    estimated_cost: Number(w.estimated_cost),
    actual_cost: Number(w.actual_cost),
    maintenance_request_ref: w.maintenance_request_id
      ? mrMap.get(w.maintenance_request_id) ?? null
      : null,
    vendor_name: w.vendor_id ? vendorsMap.get(w.vendor_id) ?? null : null,
    assigned_name: w.assigned_to ? profilesMap.get(w.assigned_to) ?? null : null,
  }));

  return {
    workOrders,
    maintenanceRequests: (mrRes.data ?? []).map((m) => ({
      id: m.id,
      reference: m.reference,
      title: m.title,
    })),
    vendors: vendorsRes.data ?? [],
    profiles: profilesRes.data ?? [],
    companyId,
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

export default async function WorkOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Work Orders</h2>
        <p className="text-muted-foreground">
          Manage work orders and vendor assignments
        </p>
      </div>

      <Suspense fallback={<WorkOrdersTableSkeleton />}>
        <WorkOrdersContent />
      </Suspense>
    </div>
  );
}

async function WorkOrdersContent() {
  const {
    workOrders,
    companyId,
    maintenanceRequests,
    vendors,
    profiles,
  } = await getWorkOrdersData();

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
    />
  );
}
