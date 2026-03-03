import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentsTable } from "@/components/accounts/payments-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type PaymentsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  method?: string;
};

async function getPaymentsData(searchParams: PaymentsSearchParams) {
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
      payments: [] as {
        id: string;
        reference: string;
        invoice_reference: string | null;
        amount: number;
        payment_date: string;
        method: string;
      }[],
      invoices: [] as { id: string; reference: string }[],
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
  const methodFilter = searchParams.method ?? "all";

  let query = supabase
    .from("payments")
    .select("id, reference, invoice_id, amount, payment_date, method", { count: "exact" })
    .eq("company_id", companyId)
    .order("payment_date", { ascending: false });

  if (search) {
    query = query.ilike("reference", `%${search}%`);
  }
  if (methodFilter !== "all") {
    query = query.eq("method", methodFilter);
  }

  const [paymentsRes, invoicesRes] = await Promise.all([
    query.range(from, to),
    supabase
      .from("invoices")
      .select("id, reference")
      .eq("company_id", companyId),
  ]);

  const count = paymentsRes.count ?? 0;
  const invoicesMap = new Map(
    (invoicesRes.data ?? []).map((i) => [i.id, i.reference])
  );

  const payments = (paymentsRes.data ?? []).map((p) => ({
    ...p,
    amount: Number(p.amount),
    invoice_reference: p.invoice_id
      ? invoicesMap.get(p.invoice_id) ?? null
      : null,
  }));

  return {
    payments,
    invoices: invoicesRes.data ?? [],
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<PaymentsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">
            Record and track payments received
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<PaymentsTableSkeleton />}>
          <PaymentsContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function PaymentsContent({ params }: { params: PaymentsSearchParams }) {
  const { payments, companyId, invoices, totalCount, page, pageSize } = await getPaymentsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage payments.
        </p>
      </div>
    );
  }

  return (
    <PaymentsTable
      initialPayments={payments}
      companyId={companyId}
      invoices={invoices}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        method: params.method ?? "all",
      }}
    />
  );
}

function PaymentsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
