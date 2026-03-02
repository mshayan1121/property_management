import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { MaintenanceTable } from "@/components/operations/maintenance-table";

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

async function getMaintenanceData() {
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
    };
  }

  const [requestsRes, propertiesRes, unitsRes, tenantsRes, profilesRes] =
    await Promise.all([
      supabase
        .from("maintenance_requests")
        .select("id, reference, title, description, property_id, unit_id, tenant_id, category, priority, status, assigned_to, estimated_cost, actual_cost")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("properties")
        .select("id, reference, name")
        .eq("company_id", companyId),
      supabase
        .from("units")
        .select("id, unit_number, property_id")
        .eq("company_id", companyId),
      supabase
        .from("tenants")
        .select("id, full_name, reference")
        .eq("company_id", companyId),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("company_id", companyId),
    ]);

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

export default async function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Maintenance Requests
        </h2>
        <p className="text-muted-foreground">
          Track and manage maintenance requests
        </p>
      </div>

      <Suspense fallback={<MaintenanceTableSkeleton />}>
        <MaintenanceContent />
      </Suspense>
    </div>
  );
}

async function MaintenanceContent() {
  const {
    requests,
    companyId,
    properties,
    units,
    tenants,
    profiles,
  } = await getMaintenanceData();

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
    />
  );
}
