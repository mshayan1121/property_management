import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantsTable } from "@/components/properties/tenants-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type TenantsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
  property?: string;
};

async function getTenantsData(searchParams: TenantsSearchParams) {
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
      tenants: [] as {
        id: string;
        reference: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        contact_id: string | null;
        unit_id: string | null;
        unit_number: string;
        property_name: string;
        lease_start: string;
        lease_end: string;
        monthly_rent: number;
        payment_day: number;
        status: string;
        notes: string | null;
        daysUntilExpiry: number;
      }[],
      units: [] as { id: string; unit_number: string; property_name: string; status: string }[],
      contacts: [] as { id: string; full_name: string }[],
      properties: [] as { id: string; name: string }[],
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
  const propertyFilter = searchParams.property ?? "all";

  let query = supabase
    .from("tenants")
    .select("id, reference, full_name, email, phone, contact_id, unit_id, lease_start, lease_end, monthly_rent, payment_day, status, notes", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  if (propertyFilter !== "all") {
    const { data: unitIds } = await supabase
      .from("units")
      .select("id")
      .eq("company_id", companyId)
      .eq("property_id", propertyFilter);
    const ids = (unitIds ?? []).map((u) => u.id);
    if (ids.length > 0) {
      query = query.in("unit_id", ids);
    } else {
      query = query.eq("unit_id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const [tenantsRes, unitsRes, contactsRes, propertiesRes] = await Promise.all([
    query.range(from, to),
    supabase
      .from("units")
      .select("id, unit_number, property_id, status")
      .eq("company_id", companyId),
    supabase.from("contacts").select("id, full_name").eq("company_id", companyId),
    supabase.from("properties").select("id, name").eq("company_id", companyId),
  ]);

  const count = tenantsRes.count ?? 0;
  const properties = propertiesRes.data ?? [];
  const propertyNames = new Map(properties.map((p) => [p.id, p.name]));
  const units = unitsRes.data ?? [];
  const unitMap = new Map(units.map((u) => [u.id, { ...u, property_name: propertyNames.get(u.property_id) ?? "-" }]));

  const tenants = (tenantsRes.data ?? []).map((t) => {
    const unit = t.unit_id ? unitMap.get(t.unit_id) : null;
    return {
      ...t,
      unit_number: unit?.unit_number ?? "-",
      property_name: unit?.property_name ?? "-",
      daysUntilExpiry: 0,
      contact_id: t.contact_id ?? null,
      notes: t.notes ?? null,
      payment_day: t.payment_day ?? 1,
    };
  });

  const unitsWithProperty = units.map((u) => ({
    id: u.id,
    unit_number: u.unit_number,
    property_name: propertyNames.get(u.property_id) ?? "-",
    status: u.status,
  }));

  const contacts = contactsRes.data ?? [];

  return {
    tenants: tenants as {
      id: string;
      reference: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      contact_id: string | null;
      unit_id: string | null;
      unit_number: string;
      property_name: string;
      lease_start: string;
      lease_end: string;
      monthly_rent: number;
      payment_day: number;
      status: string;
      notes: string | null;
      daysUntilExpiry: number;
    }[],
    units: unitsWithProperty,
    contacts,
    properties,
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<TenantsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground">Manage tenants and leases</p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<TenantsSkeleton />}>
          <TenantsContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function TenantsContent({ params }: { params: TenantsSearchParams }) {
  const { tenants, units, contacts, properties, companyId, totalCount, page, pageSize } = await getTenantsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage tenants.
        </p>
      </div>
    );
  }

  return (
    <TenantsTable
      initialTenants={tenants}
      units={units}
      contacts={contacts}
      properties={properties}
      companyId={companyId}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        status: params.status ?? "all",
        property: params.property ?? "all",
      }}
    />
  );
}

function TenantsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Skeleton className="h-10 flex-1 max-w-sm min-w-[160px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
