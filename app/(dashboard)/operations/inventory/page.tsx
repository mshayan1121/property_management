import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryTable } from "@/components/operations/inventory-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type InventorySearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  category?: string;
  status?: string;
  property?: string;
};

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

async function getInventoryData(searchParams: InventorySearchParams) {
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
  const categoryFilter = searchParams.category ?? "all";
  const statusFilter = searchParams.status ?? "all";
  const propertyFilter = searchParams.property ?? "all";

  let query = supabase
    .from("inventory_items")
    .select("id, name, description, category, property_id, quantity, unit, minimum_quantity, status", { count: "exact" })
    .eq("company_id", companyId)
    .order("name");

  if (search) query = query.ilike("name", `%${search}%`);
  if (categoryFilter !== "all") query = query.eq("category", categoryFilter);
  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (propertyFilter !== "all") query = query.eq("property_id", propertyFilter);

  const [itemsRes, propertiesRes] = await Promise.all([
    query.range(from, to),
    supabase.from("properties").select("id, reference, name").eq("company_id", companyId),
  ]);

  const count = itemsRes.count ?? 0;
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
    totalCount: count,
    page,
    pageSize,
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

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<InventorySearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Track inventory items and stock levels
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<InventoryTableSkeleton />}>
          <InventoryContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function InventoryContent({ params }: { params: InventorySearchParams }) {
  const { items, companyId, properties, totalCount, page, pageSize } =
    await getInventoryData(params);

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
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        category: params.category ?? "all",
        status: params.status ?? "all",
        property: params.property ?? "all",
      }}
    />
  );
}
