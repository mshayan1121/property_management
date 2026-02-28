import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractsTable } from "@/components/crm/contracts-table";

async function getContractsData() {
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
    };
  }

  const [contractsRes, dealsRes, contactsRes] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, reference, deal_id, contact_id, type, start_date, end_date, value, status, document_url, notes")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("deals")
      .select("id, reference")
      .eq("company_id", companyId),
    supabase
      .from("contacts")
      .select("id, full_name")
      .eq("company_id", companyId),
  ]);

  const contactsMap = new Map(
    (contactsRes.data ?? []).map((c) => [c.id, c.full_name])
  );

  const contracts = (contractsRes.data ?? []).map((c) => ({
    ...c,
    contact_name: c.contact_id
      ? contactsMap.get(c.contact_id) ?? null
      : null,
  }));

  return {
    contracts,
    deals: dealsRes.data ?? [],
    contacts: contactsRes.data ?? [],
    companyId,
  };
}

export default async function ContractsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contracts</h2>
        <p className="text-muted-foreground">
          Manage contracts and documents
        </p>
      </div>

      <Suspense fallback={<ContractsTableSkeleton />}>
        <ContractsContent />
      </Suspense>
    </div>
  );
}

async function ContractsContent() {
  const { contracts, deals, contacts, companyId } =
    await getContractsData();

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
    />
  );
}

function ContractsTableSkeleton() {
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
