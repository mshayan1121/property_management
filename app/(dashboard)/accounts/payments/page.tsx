import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentsTable } from "@/components/accounts/payments-table";

async function getPaymentsData() {
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
    };
  }

  const [paymentsRes, invoicesRes] = await Promise.all([
    supabase
      .from("payments")
      .select("id, reference, invoice_id, amount, payment_date, method")
      .eq("company_id", companyId)
      .order("payment_date", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, reference")
      .eq("company_id", companyId),
  ]);

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
  };
}

export default async function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
        <p className="text-muted-foreground">
          Record and track payments received
        </p>
      </div>

      <Suspense fallback={<PaymentsTableSkeleton />}>
        <PaymentsContent />
      </Suspense>
    </div>
  );
}

async function PaymentsContent() {
  const { payments, companyId, invoices } = await getPaymentsData();

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
