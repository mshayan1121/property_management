import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoicesTable } from "@/components/accounts/invoices-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type InvoicesSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  type?: string;
  status?: string;
};

async function getInvoicesData(searchParams: InvoicesSearchParams) {
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
      invoices: [] as {
        id: string;
        reference: string;
        type: string;
        contract_id: string | null;
        tenant_id: string | null;
        contact_id: string | null;
        tenant_name: string | null;
        contact_name: string | null;
        amount: number;
        vat_amount: number;
        total_amount: number;
        due_date: string;
        status: string;
        notes: string | null;
      }[],
      contracts: [] as { id: string; reference: string | null }[],
      tenants: [] as { id: string; reference: string; full_name: string }[],
      contacts: [] as { id: string; full_name: string }[],
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
  const typeFilter = searchParams.type ?? "all";
  const statusFilter = searchParams.status ?? "all";

  let query = supabase
    .from("invoices")
    .select("id, reference, type, contract_id, tenant_id, contact_id, amount, vat_amount, total_amount, due_date, status, notes", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("reference", `%${search}%`);
  }
  if (typeFilter !== "all") {
    query = query.eq("type", typeFilter);
  }
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const [invoicesRes, contractsRes, tenantsRes, contactsRes] = await Promise.all([
    query.range(from, to),
    supabase
      .from("contracts")
      .select("id, reference")
      .eq("company_id", companyId),
    supabase
      .from("tenants")
      .select("id, reference, full_name")
      .eq("company_id", companyId),
    supabase
      .from("contacts")
      .select("id, full_name")
      .eq("company_id", companyId),
  ]);

  const count = invoicesRes.count ?? 0;
  const tenantsMap = new Map(
    (tenantsRes.data ?? []).map((t) => [t.id, { reference: t.reference, full_name: t.full_name }])
  );
  const contactsMap = new Map(
    (contactsRes.data ?? []).map((c) => [c.id, c.full_name])
  );

  const invoices = (invoicesRes.data ?? []).map((inv) => ({
    ...inv,
    amount: Number(inv.amount),
    vat_amount: Number(inv.vat_amount),
    total_amount: Number(inv.total_amount),
    tenant_name: inv.tenant_id
      ? tenantsMap.get(inv.tenant_id)?.full_name ?? null
      : null,
    contact_name: inv.contact_id
      ? contactsMap.get(inv.contact_id) ?? null
      : null,
  }));

  return {
    invoices,
    contracts: contractsRes.data ?? [],
    tenants: tenantsRes.data ?? [],
    contacts: contactsRes.data ?? [],
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<InvoicesSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            Manage invoices and track payments
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<InvoicesTableSkeleton />}>
          <InvoicesContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function InvoicesContent({ params }: { params: InvoicesSearchParams }) {
  const { invoices, companyId, contracts, tenants, contacts, totalCount, page, pageSize } =
    await getInvoicesData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage invoices.
        </p>
      </div>
    );
  }

  return (
    <InvoicesTable
      initialInvoices={invoices}
      companyId={companyId}
      contracts={contracts}
      tenants={tenants}
      contacts={contacts}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        type: params.type ?? "all",
        status: params.status ?? "all",
      }}
    />
  );
}

function InvoicesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
