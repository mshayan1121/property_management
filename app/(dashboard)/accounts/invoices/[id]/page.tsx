import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { InvoiceDetailClient } from "@/components/accounts/invoice-detail-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

async function getInvoiceDetail(id: string) {
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
  if (!companyId) return null;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  if (error || !invoice) return null;

  const [paymentsRes, pdcsRes, tenantRes, contactRes] = await Promise.all([
    supabase
      .from("payments")
      .select("id, reference, amount, payment_date, method, notes, created_at")
      .eq("invoice_id", id)
      .order("payment_date", { ascending: false }),
    supabase
      .from("pdcs")
      .select("id, reference, cheque_number, bank_name, amount, cheque_date, status")
      .eq("invoice_id", id)
      .order("cheque_date", { ascending: false }),
    invoice.tenant_id
      ? supabase
          .from("tenants")
          .select("reference, full_name")
          .eq("id", invoice.tenant_id)
          .single()
      : Promise.resolve({ data: null }),
    invoice.contact_id
      ? supabase
          .from("contacts")
          .select("full_name")
          .eq("id", invoice.contact_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const payments = (paymentsRes.data ?? []).map((p) => ({
    ...p,
    amount: Number(p.amount),
  }));
  const pdcs = (pdcsRes.data ?? []).map((p) => ({
    ...p,
    amount: Number(p.amount),
  }));

  const tenant = tenantRes.data;
  const contact = contactRes.data;

  return {
    invoice: {
      ...invoice,
      amount: Number(invoice.amount),
      vat_amount: Number(invoice.vat_amount),
      total_amount: Number(invoice.total_amount),
      tenant_name: tenant?.full_name ?? null,
      contact_name: contact?.full_name ?? null,
      tenant_reference: tenant?.reference ?? null,
    },
    payments,
    pdcs,
    companyId,
  };
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getInvoiceDetail(id);

  if (!data) notFound();

  const { invoice, payments, pdcs, companyId } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts/invoices">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Invoice {invoice.reference}
          </h2>
          <p className="text-muted-foreground">Invoice details and payments</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Invoice information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-medium">{invoice.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize">{invoice.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant / Contact</span>
              <span>
                {invoice.tenant_name
                  ? `${invoice.tenant_reference ?? ""} – ${invoice.tenant_name}`
                  : invoice.contact_name ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due date</span>
              <span>{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[invoice.status] ?? "bg-muted"
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-muted-foreground">Amount (AED)</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (AED)</span>
              <span>{formatCurrency(invoice.vat_amount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total (AED)</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
            {invoice.notes && (
              <div className="border-t pt-2">
                <span className="text-muted-foreground">Notes</span>
                <p className="mt-1">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
            <InvoiceDetailClient
              invoiceId={id}
              invoiceReference={invoice.reference}
              totalAmount={invoice.total_amount}
              status={invoice.status}
              companyId={companyId}
              initialPayments={payments}
              initialPdcs={pdcs}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
