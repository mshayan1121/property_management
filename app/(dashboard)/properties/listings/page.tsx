import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertiesTable } from "@/components/properties/properties-table";
import { TableSkeleton } from "@/components/shared/table-skeleton";

type ListingsSearchParams = { page?: string; pageSize?: string };

async function getListingsData(searchParams: ListingsSearchParams) {
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
      properties: [] as {
        id: string;
        reference: string;
        name: string;
        type: string | null;
        location: string;
        address: string | null;
        total_units: number;
        occupied: number;
        occupancyPct: number;
        status: string;
        images: string[] | null;
      }[],
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

  const [propertiesRes, unitsRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id, reference, name, type, location, address, total_units, status, images", { count: "exact" })
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase.from("units").select("id, property_id, status").eq("company_id", companyId),
  ]);

  const properties = propertiesRes.data ?? [];
  const count = propertiesRes.count ?? 0;
  const units = unitsRes.data ?? [];
  const occupiedByProperty: Record<string, number> = {};
  const totalByProperty: Record<string, number> = {};
  units.forEach((u) => {
    totalByProperty[u.property_id] = (totalByProperty[u.property_id] ?? 0) + 1;
    if (u.status === "occupied") {
      occupiedByProperty[u.property_id] = (occupiedByProperty[u.property_id] ?? 0) + 1;
    }
  });

  const propertyRows = properties.map((p) => {
    const total = totalByProperty[p.id] ?? p.total_units;
    const occupied = occupiedByProperty[p.id] ?? 0;
    const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return {
      id: p.id,
      reference: p.reference,
      name: p.name,
      type: p.type,
      location: p.location,
      address: p.address,
      total_units: total,
      occupied,
      occupancyPct,
      status: p.status,
      images: p.images,
    };
  });

  return { properties: propertyRows, companyId, totalCount: count, page, pageSize };
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<ListingsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Listings</h2>
        <p className="text-muted-foreground">Manage your properties</p>
      </div>

      <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={10} columns={8} />}>
        <ListingsContent params={params} />
      </Suspense>
    </div>
  );
}

async function ListingsContent({ params }: { params: ListingsSearchParams }) {
  const { properties, companyId, totalCount, page, pageSize } = await getListingsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage properties.
        </p>
      </div>
    );
  }

  return (
    <PropertiesTable
      initialProperties={properties}
      companyId={companyId}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
    />
  );
}
