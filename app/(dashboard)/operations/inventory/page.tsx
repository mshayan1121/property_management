import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryTable } from "@/components/operations/inventory-table";

type InventoryRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  property_id: string | null;
  property_name: string | null;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  status: string;
};

async function getInventoryData() {
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
      items: [] as InventoryRow[],
      properties: [] as { id: string; reference: string; name: string }[],
      companyId: "",
    };
  }

  const [itemsRes, propertiesRes] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, description, category, property_id, quantity, unit, minimum_quantity, status")
      .eq("company_id", companyId)
      .order("name"),
    supabase
      .from("properties")
      .select("id, reference, name")
      .eq("company_id", companyId),
  ]);

  const propertiesMap = new Map(
    (propertiesRes.data ?? []).map((p) => [p.id, p.name])
  );

  const items: InventoryRow[] = (itemsRes.data ?? []).map((i) => ({
    ...i,
    quantity: Number(i.quantity),
    minimum_quantity: Number(i.minimum_quantity),
    property_name: i.property_id ? propertiesMap.get(i.property_id) ?? null : null,
  }));

  return {
    items,
    properties: propertiesRes.data ?? [],
    companyId,
  };
}

function InventoryTableSkeleton() {
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

export default async function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground">
          Track inventory items and stock levels
        </p>
      </div>

      <Suspense fallback={<InventoryTableSkeleton />}>
        <InventoryContent />
      </Suspense>
    </div>
  );
}

async function InventoryContent() {
  const { items, companyId, properties } = await getInventoryData();

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage inventory.
        </p>
      </div>
    );
  }

  return (
    <InventoryTable
      initialItems={items}
      companyId={companyId}
      properties={properties}
    />
  );
}
