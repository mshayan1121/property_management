import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { UnitsTable } from "@/components/properties/units-table";
import { TableSkeleton } from "@/components/shared/table-skeleton";

type UnitsSearchParams = { page?: string; pageSize?: string };

async function getUnitsData(searchParams: UnitsSearchParams) {
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
      totalCount: 0,
      page: 1,
      pageSize: 10,
    };
  }

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize ?? "10", 10) || 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const [unitsRes, propertiesRes] = await Promise.all([
    supabase
      .from("units")
      .select("id, property_id, unit_number, floor, size_sqft, bedrooms, bathrooms, type, status, rent_amount", { count: "exact" })
      .eq("company_id", companyId)
      .order("property_id")
      .order("unit_number")
      .range(from, to),
    supabase.from("properties").select("id, name").eq("company_id", companyId).order("name"),
  ]);

  const properties = propertiesRes.data ?? [];
  const propertyNames = new Map(properties.map((p) => [p.id, p.name]));
  const units = (unitsRes.data ?? []).map((u) => ({
    ...u,
    property_name: propertyNames.get(u.property_id) ?? "-",
  }));
  const totalCount = unitsRes.count ?? 0;

  return { units, properties, companyId, totalCount, page, pageSize };
}

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Promise<UnitsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Units</h2>
        <p className="text-muted-foreground">Manage units across properties</p>
      </div>

      <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={10} columns={8} />}>
        <UnitsContent params={params} />
      </Suspense>
    </div>
  );
}

async function UnitsContent({ params }: { params: UnitsSearchParams }) {
  const { units, properties, companyId, totalCount, page, pageSize } = await getUnitsData(params);

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
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
    />
  );
}
