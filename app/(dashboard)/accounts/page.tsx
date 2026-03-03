import { Suspense, cache } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AccountsDashboardClient } from "@/components/accounts/accounts-dashboard-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { subMonths, format } from "date-fns";
import { ErrorBoundary } from "@/components/shared/error-boundary";

const getAccountsStats = cache(async () => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      profitLoss: 0,
      outstandingPayments: 0,
      invoicesByStatus: [] as { name: string; value: number }[],
      billsByStatus: [] as { name: string; value: number }[],
      revenueVsExpenses: [] as { month: string; revenue: number; expenses: number }[],
      recentInvoices: [] as {
        id: string;
        reference: string;
        type: string;
        total_amount: number;
        status: string;
      }[],
      recentBills: [] as {
        id: string;
        reference: string;
        category: string;
        total_amount: number;
        status: string;
      }[],
    };
  }

  const [invoicesRes, billsRes, paymentsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, reference, type, amount, total_amount, status, due_date")
      .eq("company_id", companyId),
    supabase
      .from("bills")
      .select("id, reference, category, amount, total_amount, status, created_at")
      .eq("company_id", companyId),
    supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("company_id", companyId),
  ]);

  const invoices = invoicesRes.data ?? [];
  const bills = billsRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.total_amount), 0);

  const totalExpenses = bills
    .filter((b) => b.status === "paid")
    .reduce((s, b) => s + Number(b.total_amount), 0);

  const profitLoss = totalRevenue - totalExpenses;

  const outstandingPayments = invoices
    .filter((i) => ["draft", "sent", "overdue"].includes(i.status))
    .reduce((s, i) => s + Number(i.total_amount), 0);

  const statusCountsInv: Record<string, number> = {};
  invoices.forEach((i) => {
    const st = i.status ?? "draft";
    statusCountsInv[st] = (statusCountsInv[st] ?? 0) + 1;
  });
  const invoicesByStatus = ["draft", "sent", "paid", "overdue", "cancelled"].map(
    (name) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: statusCountsInv[name] ?? 0,
    })
  );

  const statusCountsBills: Record<string, number> = {};
  bills.forEach((b) => {
    const st = b.status ?? "pending";
    statusCountsBills[st] = (statusCountsBills[st] ?? 0) + 1;
  });
  const billsByStatus = ["pending", "paid", "overdue", "cancelled"].map(
    (name) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: statusCountsBills[name] ?? 0,
    })
  );

  const now = new Date();
  const revenueByMonth: Record<string, number> = {};
  const expensesByMonth: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const key = format(d, "MMM yyyy");
    revenueByMonth[key] = 0;
    expensesByMonth[key] = 0;
  }

  payments.forEach((p) => {
    const key = format(new Date(p.payment_date), "MMM yyyy");
    if (revenueByMonth[key] !== undefined) {
      revenueByMonth[key] += Number(p.amount);
    }
  });

  const paidBills = bills.filter((b) => b.status === "paid");
  paidBills.forEach((b) => {
    const key = format(new Date(b.created_at), "MMM yyyy");
    if (expensesByMonth[key] !== undefined) {
      expensesByMonth[key] += Number(b.total_amount);
    }
  });

  const revenueVsExpenses = Object.keys(revenueByMonth).map((month) => ({
    month,
    revenue: revenueByMonth[month] ?? 0,
    expenses: expensesByMonth[month] ?? 0,
  }));

  const recentInvoices = invoices
    .sort(
      (a, b) =>
        new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
    )
    .slice(0, 5)
    .map((i) => ({
      id: i.id,
      reference: i.reference,
      type: i.type,
      total_amount: Number(i.total_amount),
      status: i.status,
    }));

  const recentBills = bills
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      reference: b.reference,
      category: b.category,
      total_amount: Number(b.total_amount),
      status: b.status,
    }));

  return {
    totalRevenue,
    totalExpenses,
    profitLoss,
    outstandingPayments,
    invoicesByStatus,
    billsByStatus,
    revenueVsExpenses,
    recentInvoices,
    recentBills,
  };
});

export default async function AccountsDashboardPage() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Accounts & Finance
            </h2>
            <p className="text-muted-foreground">
              Revenue, expenses, and financial overview
            </p>
          </div>
        </div>

        <Suspense fallback={<AccountsStatsSkeleton />}>
          <AccountsStatsCards />
        </Suspense>

        <Suspense fallback={<AccountsChartsSkeleton />}>
          <AccountsCharts />
        </Suspense>

        <Suspense fallback={<RecentTablesSkeleton />}>
          <RecentTables />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function AccountsStatsCards() {
  const stats = await getAccountsStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-muted-foreground text-xs">Paid invoices</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(stats.totalExpenses)}
          </p>
          <p className="text-muted-foreground text-xs">Paid bills</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit / Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${
              stats.profitLoss >= 0
                ? "text-foreground"
                : "text-destructive"
            }`}
          >
            {formatCurrency(stats.profitLoss)}
          </p>
          <p className="text-muted-foreground text-xs">Revenue minus expenses</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Outstanding Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(stats.outstandingPayments)}
          </p>
          <p className="text-muted-foreground text-xs">
            Unpaid / overdue invoices
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountsStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-28" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function AccountsCharts() {
  const stats = await getAccountsStats();

  return (
    <AccountsDashboardClient
      invoicesByStatus={stats.invoicesByStatus}
      billsByStatus={stats.billsByStatus}
      revenueVsExpenses={stats.revenueVsExpenses}
    />
  );
}

function AccountsChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

async function RecentTables() {
  const stats = await getAccountsStats();

  const invoiceStatusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    paid: "bg-green-500/10 text-green-600 dark:text-green-400",
    overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
    cancelled: "bg-muted text-muted-foreground",
  };

  const billStatusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    paid: "bg-green-500/10 text-green-600 dark:text-green-400",
    overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Last 5 invoices</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/accounts/invoices">
              <Plus className="mr-2 size-4" />
              Add Invoice
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground text-sm">No invoices yet</p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/accounts/invoices">Add your first invoice</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">Reference</th>
                    <th className="pb-2 text-left font-medium">Type</th>
                    <th className="pb-2 text-left font-medium">Amount</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentInvoices.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          href={`/accounts/invoices/${i.id}`}
                          className="font-medium hover:underline"
                        >
                          {i.reference}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground capitalize">
                        {i.type}
                      </td>
                      <td className="py-3">
                        {formatCurrency(i.total_amount)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            invoiceStatusColors[i.status] ?? "bg-muted"
                          }`}
                        >
                          {i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Bills</CardTitle>
            <CardDescription>Last 5 bills</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/accounts/bills">
              <Plus className="mr-2 size-4" />
              Add Bill
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground text-sm">No bills yet</p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/accounts/bills">Add your first bill</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">Reference</th>
                    <th className="pb-2 text-left font-medium">Category</th>
                    <th className="pb-2 text-left font-medium">Amount</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentBills.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{b.reference}</td>
                      <td className="py-3 text-muted-foreground capitalize">
                        {b.category}
                      </td>
                      <td className="py-3">
                        {formatCurrency(b.total_amount)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            billStatusColors[b.status] ?? "bg-muted"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecentTablesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
