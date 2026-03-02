import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantsTable } from "@/components/properties/tenants-table";

async function getTenantsData() {
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
    };
  }

  const [tenantsRes, unitsRes, contactsRes, propertiesRes] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, reference, full_name, email, phone, contact_id, unit_id, lease_start, lease_end, monthly_rent, payment_day, status, notes")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("units")
      .select("id, unit_number, property_id, status")
      .eq("company_id", companyId),
    supabase.from("contacts").select("id, full_name").eq("company_id", companyId),
    supabase.from("properties").select("id, name").eq("company_id", companyId),
  ]);

  const properties = propertiesRes.data ?? [];
  const propertyNames = new Map(properties.map((p) => [p.id, p.name]));
  const units = unitsRes.data ?? [];
  const unitMap = new Map(units.map((u) => [u.id, { ...u, property_name: propertyNames.get(u.property_id) ?? "-" }]));

  // daysUntilExpiry is computed on the client to avoid hydration mismatch (server vs client "today")
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
  };
}

export default async function TenantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
        <p className="text-muted-foreground">Manage tenants and leases</p>
      </div>

      <Suspense fallback={<TenantsSkeleton />}>
        <TenantsContent />
      </Suspense>
    </div>
  );
}

async function TenantsContent() {
  const { tenants, units, contacts, properties, companyId } = await getTenantsData();

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
