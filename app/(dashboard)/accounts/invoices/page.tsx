import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoicesTable } from "@/components/accounts/invoices-table";

async function getInvoicesData() {
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
    };
  }

  const [invoicesRes, contractsRes, tenantsRes, contactsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, reference, type, contract_id, tenant_id, contact_id, amount, vat_amount, total_amount, due_date, status, notes")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
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
  };
}

export default async function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
        <p className="text-muted-foreground">
          Manage invoices and track payments
        </p>
      </div>

      <Suspense fallback={<InvoicesTableSkeleton />}>
        <InvoicesContent />
      </Suspense>
    </div>
  );
}

async function InvoicesContent() {
  const { invoices, companyId, contracts, tenants, contacts } =
    await getInvoicesData();

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
