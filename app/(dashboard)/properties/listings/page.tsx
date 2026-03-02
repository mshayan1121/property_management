import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertiesTable } from "@/components/properties/properties-table";

async function getListingsData() {
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
    };
  }

  const [propertiesRes, unitsRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id, reference, name, type, location, address, total_units, status, images")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase.from("units").select("id, property_id, status").eq("company_id", companyId),
  ]);

  const properties = propertiesRes.data ?? [];
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

  return { properties: propertyRows, companyId };
}

export default async function ListingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Listings</h2>
        <p className="text-muted-foreground">Manage your properties</p>
      </div>

      <Suspense fallback={<ListingsSkeleton />}>
        <ListingsContent />
      </Suspense>
    </div>
  );
}

async function ListingsContent() {
  const { properties, companyId } = await getListingsData();

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
    <PropertiesTable initialProperties={properties} companyId={companyId} />
  );
}

function ListingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
