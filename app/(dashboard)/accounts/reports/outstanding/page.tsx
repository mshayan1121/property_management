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
import { OutstandingReportClient } from "@/components/accounts/outstanding-report-client";
import { differenceInDays, parseISO } from "date-fns";

async function getOutstandingData(typeFilter: string, ageFilter: string) {
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

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, reference, type, total_amount, due_date, status")
    .eq("company_id", companyId)
    .in("status", ["draft", "sent", "overdue"])
    .order("due_date");

  let rows = (invoices ?? []).map((i) => ({
    id: i.id,
    reference: i.reference,
    type: i.type,
    total_amount: Number(i.total_amount),
    due_date: i.due_date,
    status: i.status,
    daysOverdue: differenceInDays(new Date(), parseISO(i.due_date)),
  }));

  if (typeFilter && typeFilter !== "all") {
    rows = rows.filter((r) => r.type === typeFilter);
  }
  if (ageFilter && ageFilter !== "all") {
    if (ageFilter === "30") {
      rows = rows.filter((r) => r.daysOverdue >= 0 && r.daysOverdue <= 30);
    } else if (ageFilter === "60") {
      rows = rows.filter((r) => r.daysOverdue > 30 && r.daysOverdue <= 60);
    } else if (ageFilter === "90") {
      rows = rows.filter((r) => r.daysOverdue > 60);
    }
  }

  const totalOutstanding = rows.reduce((s, r) => s + r.total_amount, 0);

  return {
    rows,
    totalOutstanding,
  };
}

export default async function OutstandingReportPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; age?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type ?? "all";
  const ageFilter = params.age ?? "all";

  const data = await getOutstandingData(typeFilter, ageFilter);

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
          <h2 className="text-2xl font-bold tracking-tight">
            Outstanding Payments
          </h2>
          <p className="text-muted-foreground">
            Unpaid and overdue invoices
          </p>
        </div>
      </div>

      <OutstandingReportClient
        typeFilter={typeFilter}
        ageFilter={ageFilter}
      />

      <Card>
        <CardHeader>
          <CardTitle>Total outstanding</CardTitle>
          <CardDescription>Sum of unpaid invoice amounts (AED)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(data.totalOutstanding)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Unpaid / overdue list</CardDescription>
        </CardHeader>
        <CardContent>
          {data.rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No outstanding invoices match the filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Days overdue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/accounts/invoices/${r.id}`}
                        className="hover:underline"
                      >
                        {r.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">{r.type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(r.due_date)}
                    </TableCell>
                    <TableCell>
                      {r.daysOverdue > 0 ? r.daysOverdue : "—"}
                    </TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(r.total_amount)}
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
