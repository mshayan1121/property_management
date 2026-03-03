import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { VendorsTable } from "@/components/accounts/vendors-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type VendorsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  category?: string;
  status?: string;
};

async function getVendorsData(searchParams: VendorsSearchParams) {
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
      vendors: [] as {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        category: string | null;
        address: string | null;
        trn: string | null;
        status: string;
        notes: string | null;
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
  const search = (searchParams.search ?? "").trim();
  const categoryFilter = searchParams.category ?? "all";
  const statusFilter = searchParams.status ?? "all";

  let query = supabase
    .from("vendors")
    .select("id, name, email, phone, category, address, trn, status, notes", { count: "exact" })
    .eq("company_id", companyId)
    .order("name");

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (categoryFilter !== "all") {
    query = query.eq("category", categoryFilter);
  }
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: vendors, count } = await query.range(from, to);

  return {
    vendors: vendors ?? [],
    companyId,
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<VendorsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendors</h2>
          <p className="text-muted-foreground">
            Manage vendor database and track payments
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<VendorsTableSkeleton />}>
          <VendorsContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function VendorsContent({ params }: { params: VendorsSearchParams }) {
  const { vendors, companyId, totalCount, page, pageSize } = await getVendorsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage vendors.
        </p>
      </div>
    );
  }

  return (
    <VendorsTable
      initialVendors={vendors}
      companyId={companyId}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        category: params.category ?? "all",
        status: params.status ?? "all",
      }}
    />
  );
}

function VendorsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
