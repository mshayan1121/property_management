import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { BillsTable } from "@/components/accounts/bills-table";

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

async function getBillsData() {
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
    };
  }

  const [billsRes, propertiesRes, vendorsRes, companyRes] = await Promise.all([
    supabase
      .from("bills")
      .select("id, reference, property_id, vendor_id, category, description, amount, vat_amount, total_amount, due_date, status, notes")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
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
  };
}

export default async function BillsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bills</h2>
        <p className="text-muted-foreground">
          Manage expenses and vendor bills
        </p>
      </div>

      <Suspense fallback={<BillsTableSkeleton />}>
        <BillsContent />
      </Suspense>
    </div>
  );
}

async function BillsContent() {
  const { bills, companyId, companyName, properties, vendors } = await getBillsData();

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
