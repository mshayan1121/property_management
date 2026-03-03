import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { BillsTable } from "@/components/accounts/bills-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type BillsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  category?: string;
  status?: string;
  property?: string;
};

type BillRow = {
  id: string;
  reference: string;
  property_id: string | null;
  vendor_id: string | null;
  property_name: string | null;
  vendor_name: string | null;
  category: string;
  description: string | null;
  amount: number;
  vat_amount: number;
  total_amount: number;
  due_date: string;
  status: string;
  notes: string | null;
};

async function getBillsData(searchParams: BillsSearchParams) {
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
      bills: [] as BillRow[],
      properties: [] as { id: string; reference: string; name: string }[],
      vendors: [] as { id: string; name: string }[],
      companyId: "",
      companyName: "Jetset Business",
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
    .from("bills")
    .select("id, reference, property_id, vendor_id, category, description, amount, vat_amount, total_amount, due_date, status, notes", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`reference.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (categoryFilter !== "all") {
    query = query.eq("category", categoryFilter);
  }
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  if (propertyFilter !== "all") {
    query = query.eq("property_id", propertyFilter);
  }

  const [billsRes, propertiesRes, vendorsRes, companyRes] = await Promise.all([
    query.range(from, to),
    supabase
      .from("properties")
      .select("id, reference, name")
      .eq("company_id", companyId),
    supabase
      .from("vendors")
      .select("id, name")
      .eq("company_id", companyId),
    supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single(),
  ]);

  const count = billsRes.count ?? 0;
  const propertiesMap = new Map(
    (propertiesRes.data ?? []).map((p) => [p.id, p.name])
  );
  const vendorsMap = new Map(
    (vendorsRes.data ?? []).map((v) => [v.id, v.name])
  );

  const bills: BillRow[] = (billsRes.data ?? []).map((b) => ({
    ...b,
    amount: Number(b.amount),
    vat_amount: Number(b.vat_amount),
    total_amount: Number(b.total_amount),
    property_name: b.property_id ? propertiesMap.get(b.property_id) ?? null : null,
    vendor_name: b.vendor_id ? vendorsMap.get(b.vendor_id) ?? null : null,
  }));

  return {
    bills,
    properties: propertiesRes.data ?? [],
    vendors: vendorsRes.data ?? [],
    companyId,
    companyName: companyRes.data?.name ?? "Jetset Business",
    totalCount: count,
    page,
    pageSize,
  };
}

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<BillsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bills</h2>
          <p className="text-muted-foreground">
            Manage expenses and vendor bills
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<BillsTableSkeleton />}>
          <BillsContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function BillsContent({ params }: { params: BillsSearchParams }) {
  const { bills, companyId, companyName, properties, vendors, totalCount, page, pageSize } = await getBillsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage bills.
        </p>
      </div>
    );
  }

  return (
    <BillsTable
      initialBills={bills}
      companyId={companyId}
      companyName={companyName}
      properties={properties}
      vendors={vendors}
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

function BillsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
