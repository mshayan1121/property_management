import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { PdcsTable } from "@/components/accounts/pdcs-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type PdcSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
};

type PdcRow = {
  id: string;
  reference: string;
  cheque_number: string;
  bank_name: string;
  tenant_id: string | null;
  invoice_id: string | null;
  amount: number;
  cheque_date: string;
  status: string;
  notes: string | null;
  tenant_name: string | null;
};

async function getPdcsData(searchParams: PdcSearchParams) {
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
      pdcs: [] as PdcRow[],
      invoices: [] as { id: string; reference: string }[],
      tenants: [] as { id: string; reference: string; full_name: string }[],
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

  let query = supabase
    .from("pdcs")
    .select("id, reference, cheque_number, bank_name, tenant_id, invoice_id, amount, cheque_date, status, notes", { count: "exact" })
    .eq("company_id", companyId)
    .order("cheque_date", { ascending: false });

  if (search) {
    query = query.or(`reference.ilike.%${search}%,cheque_number.ilike.%${search}%,bank_name.ilike.%${search}%`);
  }
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const [pdcsRes, invoicesRes, tenantsRes] = await Promise.all([
    query.range(from, to),
    supabase
      .from("invoices")
      .select("id, reference")
      .eq("company_id", companyId),
    supabase
      .from("tenants")
      .select("id, reference, full_name")
      .eq("company_id", companyId),
  ]);

  const count = pdcsRes.count ?? 0;
  const tenantsMap = new Map(
    (tenantsRes.data ?? []).map((t) => [t.id, t.full_name])
  );

  const pdcs: PdcRow[] = (pdcsRes.data ?? []).map((p) => ({
    ...p,
    amount: Number(p.amount),
    tenant_name: p.tenant_id ? tenantsMap.get(p.tenant_id) ?? null : null,
  }));

  return {
    pdcs,
    invoices: invoicesRes.data ?? [],
    tenants: tenantsRes.data ?? [],
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

export default async function PdcPage({
  searchParams,
}: {
  searchParams: Promise<PdcSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Post-dated cheques</h2>
          <p className="text-muted-foreground">
            Track PDCs and get alerts for upcoming deposits
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<PdcsTableSkeleton />}>
          <PdcsContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function PdcsContent({ params }: { params: PdcSearchParams }) {
  const { pdcs, companyId, invoices, tenants, totalCount, page, pageSize } = await getPdcsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage PDCs.
        </p>
      </div>
    );
  }

  return (
    <PdcsTable
      initialPdcs={pdcs}
      companyId={companyId}
      invoices={invoices}
      tenants={tenants}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        status: params.status ?? "all",
      }}
    />
  );
}

function PdcsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
