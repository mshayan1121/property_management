import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { UnitsTable } from "@/components/properties/units-table";

async function getUnitsData() {
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
      units: [] as {
        id: string;
        property_id: string;
        property_name: string;
        unit_number: string;
        floor: number | null;
        size_sqft: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        type: string | null;
        status: string;
        rent_amount: number;
      }[],
      properties: [] as { id: string; name: string }[],
      companyId: "",
    };
  }

  const [unitsRes, propertiesRes] = await Promise.all([
    supabase
      .from("units")
      .select("id, property_id, unit_number, floor, size_sqft, bedrooms, bathrooms, type, status, rent_amount")
      .eq("company_id", companyId)
      .order("property_id")
      .order("unit_number"),
    supabase.from("properties").select("id, name").eq("company_id", companyId).order("name"),
  ]);

  const properties = propertiesRes.data ?? [];
  const propertyNames = new Map(properties.map((p) => [p.id, p.name]));

  const units = (unitsRes.data ?? []).map((u) => ({
    ...u,
    property_name: propertyNames.get(u.property_id) ?? "-",
  }));

  return { units, properties, companyId };
}

export default async function UnitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Units</h2>
        <p className="text-muted-foreground">Manage units across properties</p>
      </div>

      <Suspense fallback={<UnitsSkeleton />}>
        <UnitsContent />
      </Suspense>
    </div>
  );
}

async function UnitsContent() {
  const { units, properties, companyId } = await getUnitsData();

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage units.
        </p>
      </div>
    );
  }

  return (
    <UnitsTable
      initialUnits={units}
      properties={properties}
      companyId={companyId}
    />
  );
}

function UnitsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Skeleton className="h-10 flex-1 max-w-sm min-w-[160px]" />
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[130px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
