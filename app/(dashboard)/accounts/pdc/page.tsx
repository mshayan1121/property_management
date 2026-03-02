import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { PdcsTable } from "@/components/accounts/pdcs-table";

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

async function getPdcsData() {
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
    };
  }

  const [pdcsRes, invoicesRes, tenantsRes] = await Promise.all([
    supabase
      .from("pdcs")
      .select("id, reference, cheque_number, bank_name, tenant_id, invoice_id, amount, cheque_date, status, notes")
      .eq("company_id", companyId)
      .order("cheque_date", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, reference")
      .eq("company_id", companyId),
    supabase
      .from("tenants")
      .select("id, reference, full_name")
      .eq("company_id", companyId),
  ]);

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
  };
}

export default async function PdcPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Post-dated cheques</h2>
        <p className="text-muted-foreground">
          Track PDCs and get alerts for upcoming deposits
        </p>
      </div>

      <Suspense fallback={<PdcsTableSkeleton />}>
        <PdcsContent />
      </Suspense>
    </div>
  );
}

async function PdcsContent() {
  const { pdcs, companyId, invoices, tenants } = await getPdcsData();

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
