import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VatReportClient } from "@/components/accounts/vat-report-client";

async function getVatData(from: string, to: string) {
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

  const [invoicesRes, billsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, reference, due_date, vat_amount, total_amount, type")
      .eq("company_id", companyId)
      .gte("due_date", from)
      .lte("due_date", to),
    supabase
      .from("bills")
      .select("id, reference, due_date, vat_amount, total_amount, category")
      .eq("company_id", companyId)
      .gte("due_date", from)
      .lte("due_date", to),
  ]);

  const invoices = (invoicesRes.data ?? []).map((i) => ({
    id: i.id,
    reference: i.reference,
    date: i.due_date,
    type: "invoice" as const,
    vat: Number(i.vat_amount),
    total: Number(i.total_amount),
    desc: i.type,
  }));
  const bills = (billsRes.data ?? []).map((b) => ({
    id: b.id,
    reference: b.reference,
    date: b.due_date,
    type: "bill" as const,
    vat: Number(b.vat_amount),
    total: Number(b.total_amount),
    desc: b.category,
  }));

  const vatCollected = invoices.reduce((s, i) => s + i.vat, 0);
  const vatPaid = bills.reduce((s, b) => s + b.vat, 0);
  const netVatPayable = vatCollected - vatPaid;

  const transactions = [...invoices, ...bills].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return {
    vatCollected,
    vatPaid,
    netVatPayable,
    transactions,
  };
}

export default async function VatReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const to = params.to ?? new Date().toISOString().slice(0, 10);
  const from =
    params.from ??
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);

  const data = await getVatData(from, to);

  if (!data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts/reports">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <p className="text-muted-foreground">
          You need to be assigned to a company to view this report.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts/reports">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">VAT Report</h2>
          <p className="text-muted-foreground">
            VAT collected and paid for the selected period
          </p>
        </div>
      </div>

      <VatReportClient from={from} to={to} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>VAT collected</CardTitle>
            <CardDescription>From invoices (AED)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.vatCollected)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>VAT paid</CardTitle>
            <CardDescription>From bills (AED)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.vatPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net VAT payable</CardTitle>
            <CardDescription>Collected minus paid (AED)</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                data.netVatPayable >= 0 ? "" : "text-destructive"
              }`}
            >
              {formatCurrency(data.netVatPayable)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>VAT transactions</CardTitle>
          <CardDescription>All invoices and bills in period</CardDescription>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No transactions in period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">VAT (AED)</TableHead>
                  <TableHead className="text-right">Total (AED)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((t) => (
                  <TableRow key={`${t.type}-${t.id}`}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell className="capitalize">{t.type}</TableCell>
                    <TableCell>
                      {t.type === "invoice" ? (
                        <Link
                          href={`/accounts/invoices/${t.id}`}
                          className="font-medium hover:underline"
                        >
                          {t.reference}
                        </Link>
                      ) : (
                        t.reference
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{t.desc}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(t.vat)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(t.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
