import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProfitLossReportClient } from "@/components/accounts/profit-loss-report-client";

async function getProfitLossData(from: string, to: string) {
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
      .select("type, amount, total_amount")
      .eq("company_id", companyId)
      .eq("status", "paid")
      .gte("due_date", from)
      .lte("due_date", to),
    supabase
      .from("bills")
      .select("category, amount, total_amount")
      .eq("company_id", companyId)
      .eq("status", "paid")
      .gte("due_date", from)
      .lte("due_date", to),
  ]);

  const invoices = invoicesRes.data ?? [];
  const bills = billsRes.data ?? [];

  const revenueByType: Record<string, number> = {
    rent: 0,
    sale: 0,
    service: 0,
    other: 0,
  };
  invoices.forEach((i) => {
    const t = i.type ?? "other";
    revenueByType[t] = (revenueByType[t] ?? 0) + Number(i.total_amount);
  });

  const expensesByCategory: Record<string, number> = {};
  bills.forEach((b) => {
    const c = b.category ?? "other";
    expensesByCategory[c] = (expensesByCategory[c] ?? 0) + Number(b.total_amount);
  });

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
  const totalExpenses = bills.reduce((s, b) => s + Number(b.total_amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin =
    totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    revenueByType: Object.entries(revenueByType).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    })),
    expensesByCategory: Object.entries(expensesByCategory).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      })
    ),
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
  };
}

export default async function ProfitLossReportPage({
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

  const data = await getProfitLossData(from, to);

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
            P&L Statement
          </h2>
          <p className="text-muted-foreground">
            Revenue, expenses, and net profit for the selected period
          </p>
        </div>
      </div>

      <ProfitLossReportClient
        from={from}
        to={to}
        revenueByType={data.revenueByType}
        expensesByCategory={data.expensesByCategory}
        totalRevenue={data.totalRevenue}
        totalExpenses={data.totalExpenses}
        netProfit={data.netProfit}
        profitMargin={data.profitMargin}
      />
    </div>
  );
}
