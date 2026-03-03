import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractsTable } from "@/components/crm/contracts-table";
import { TableSkeleton } from "@/components/shared/table-skeleton";

type ContractsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  type?: string;
  status?: string;
};

async function getContractsData(searchParams: ContractsSearchParams) {
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
      contracts: [] as {
        id: string;
        reference: string | null;
        deal_id: string | null;
        contact_id: string | null;
        contact_name: string | null;
        type: string | null;
        start_date: string | null;
        end_date: string | null;
        value: number;
        status: string;
        document_url: string | null;
        notes: string | null;
      }[],
      deals: [] as { id: string; reference: string | null }[],
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
    .from("contracts")
    .select("id, reference, deal_id, contact_id, type, start_date, end_date, value, status, document_url, notes", { count: "exact" })
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

  const [contractsRes, dealsRes, contactsRes] = await Promise.all([
    query.range(from, to),
    supabase.from("deals").select("id, reference").eq("company_id", companyId),
    supabase.from("contacts").select("id, full_name").eq("company_id", companyId),
  ]);

  const count = contractsRes.count ?? 0;
  const contactsMap = new Map(
    (contactsRes.data ?? []).map((c) => [c.id, c.full_name])
  );
  const contracts = (contractsRes.data ?? []).map((c) => ({
    ...c,
    contact_name: c.contact_id ? contactsMap.get(c.contact_id) ?? null : null,
  }));

  return {
    contracts,
    deals: dealsRes.data ?? [],
    contacts: contactsRes.data ?? [],
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<ContractsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contracts</h2>
        <p className="text-muted-foreground">
          Manage contracts and documents
        </p>
      </div>

      <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={10} columns={8} />}>
        <ContractsContent params={params} />
      </Suspense>
    </div>
  );
}

async function ContractsContent({ params }: { params: ContractsSearchParams }) {
  const { contracts, deals, contacts, companyId, totalCount, page, pageSize } =
    await getContractsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage contracts.
        </p>
      </div>
    );
  }

  return (
    <ContractsTable
      initialContracts={contracts}
      companyId={companyId}
      deals={deals}
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
