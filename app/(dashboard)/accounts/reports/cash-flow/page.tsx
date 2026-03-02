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
import { formatCurrency } from "@/lib/utils";
import { CashFlowReportClient } from "@/components/accounts/cash-flow-report-client";
import { format, subMonths } from "date-fns";

async function getCashFlowData(from: string, to: string) {
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

  const [paymentsRes, billsRes] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("company_id", companyId)
      .gte("payment_date", from)
      .lte("payment_date", to),
    supabase
      .from("bills")
      .select("total_amount, created_at")
      .eq("company_id", companyId)
      .eq("status", "paid")
      .gte("created_at", from)
      .lte("created_at", to + "T23:59:59"),
  ]);

  const payments = paymentsRes.data ?? [];
  const bills = billsRes.data ?? [];

  const moneyIn = payments.reduce((s, p) => s + Number(p.amount), 0);
  const moneyOut = bills.reduce((s, b) => s + Number(b.total_amount), 0);
  const netCashFlow = moneyIn - moneyOut;

  const now = new Date();
  const months: { month: string; in: number; out: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const key = format(d, "MMM yyyy");
    months.push({
      month: key,
      in: 0,
      out: 0,
    });
  }
  payments.forEach((p) => {
    const key = format(new Date(p.payment_date), "MMM yyyy");
    const row = months.find((m) => m.month === key);
    if (row) row.in += Number(p.amount);
  });
  bills.forEach((b) => {
    const key = format(new Date(b.created_at), "MMM yyyy");
    const row = months.find((m) => m.month === key);
    if (row) row.out += Number(b.total_amount);
  });

  const trendData = months.map((m) => ({
    month: m.month,
    cashFlow: m.in - m.out,
  }));

  return {
    moneyIn,
    moneyOut,
    netCashFlow,
    trendData,
  };
}

export default async function CashFlowReportPage({
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

  const data = await getCashFlowData(from, to);

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
            Cash Flow Statement
          </h2>
          <p className="text-muted-foreground">
            Money in, money out, and net cash flow
          </p>
        </div>
      </div>

      <CashFlowReportClient from={from} to={to} trendData={data.trendData} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Money in</CardTitle>
            <CardDescription>Payments received (AED)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.moneyIn)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Money out</CardTitle>
            <CardDescription>Bills paid (AED)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(data.moneyOut)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net cash flow</CardTitle>
            <CardDescription>In minus out (AED)</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                data.netCashFlow >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-destructive"
              }`}
            >
              {formatCurrency(data.netCashFlow)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
