import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import {
  Building2,
  Users,
  Handshake,
  Wallet,
  FileWarning,
  Wrench,
  CalendarClock,
  AlertCircle,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { checkAndUpdateOverdue } from "@/lib/overdue-check";
import { generateNotifications } from "@/lib/notifications";
import { OverviewCharts } from "@/components/shared/overview-charts";

async function getOverviewData() {
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
    return null;
  }

  await checkAndUpdateOverdue(companyId);
  if (user?.id) {
    await generateNotifications(companyId, user.id);
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const today = now.toISOString().slice(0, 10);
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);

  const [
    propertiesCount,
    tenantsCount,
    dealsCount,
    revenueRes,
    overdueInvoicesRes,
    openMaintenanceRes,
    leaseExpiriesRes,
    overdueInvoicesListRes,
    pdcsDueRes,
    paymentsMonthlyRes,
    billsMonthlyRes,
    dealsByStageRes,
    recentLeadsRes,
    recentDealsRes,
    recentMaintenanceRes,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "active"),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .neq("stage", "contract_signed"),
    supabase
      .from("payments")
      .select("amount")
      .eq("company_id", companyId)
      .gte("payment_date", thisMonthStart.toISOString().slice(0, 10))
      .lte("payment_date", thisMonthEnd.toISOString().slice(0, 10)),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "overdue"),
    supabase
      .from("maintenance_requests")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("tenants")
      .select("id, full_name, lease_end")
      .eq("company_id", companyId)
      .eq("status", "active")
      .gte("lease_end", today)
      .lte("lease_end", in30Days.toISOString().slice(0, 10))
      .order("lease_end", { ascending: true })
      .limit(5),
    supabase
      .from("invoices")
      .select("reference, total_amount")
      .eq("company_id", companyId)
      .eq("status", "overdue"),
    supabase
      .from("pdcs")
      .select("id, cheque_number, bank_name, amount, cheque_date")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .gte("cheque_date", today)
      .lte("cheque_date", in7Days.toISOString().slice(0, 10)),
    supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("company_id", companyId),
    supabase
      .from("bills")
      .select("total_amount, due_date")
      .eq("company_id", companyId),
    supabase
      .from("deals")
      .select("stage")
      .eq("company_id", companyId),
    supabase
      .from("leads")
      .select("full_name, source, status, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("deals")
      .select("reference, type, stage, value")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("maintenance_requests")
      .select("id, title, reference, status, property_id")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const totalRevenue =
    revenueRes.data?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const overdueInvoicesCount = overdueInvoicesRes.count ?? 0;
  const overdueList = overdueInvoicesListRes.data ?? [];
  const totalOverdueAmount = overdueList.reduce(
    (s, i) => s + Number(i.total_amount),
    0
  );
  const pdcsDue = pdcsDueRes.data ?? [];
  const pdcsDueTotal = pdcsDue.reduce((s, p) => s + Number(p.amount), 0);

  const paymentsByMonth = new Map<string, number>();
  const billsByMonth = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    paymentsByMonth.set(key, 0);
    billsByMonth.set(key, 0);
  }
  paymentsMonthlyRes.data?.forEach((p) => {
    const date = String(p.payment_date).slice(0, 7);
    if (paymentsByMonth.has(date)) {
      paymentsByMonth.set(
        date,
        (paymentsByMonth.get(date) ?? 0) + Number(p.amount)
      );
    }
  });
  billsMonthlyRes.data?.forEach((b) => {
    const date = String(b.due_date).slice(0, 7);
    if (billsByMonth.has(date)) {
      billsByMonth.set(
        date,
        (billsByMonth.get(date) ?? 0) + Number(b.total_amount)
      );
    }
  });

  const monthLabels = Array.from(paymentsByMonth.keys()).map((key) => {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return format(d, "MMM");
  });
  const revenueExpensesData = monthLabels.map((label, i) => {
    const key = Array.from(paymentsByMonth.keys())[i] ?? "";
    return {
      month: label,
      revenue: paymentsByMonth.get(key) ?? 0,
      expenses: billsByMonth.get(key) ?? 0,
    };
  });

  const stageCounts = new Map<string, number>();
  dealsByStageRes.data?.forEach((d) => {
    const s = d.stage ?? "unknown";
    stageCounts.set(s, (stageCounts.get(s) ?? 0) + 1);
  });
  const dealsByStageData = Array.from(stageCounts.entries()).map(
    ([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    })
  );

  const propertyIds = new Set(
    (recentMaintenanceRes.data ?? []).map((m) => m.property_id).filter(Boolean)
  );
  const propertiesMap = new Map<string, string>();
  if (propertyIds.size > 0) {
    const { data: props } = await supabase
      .from("properties")
      .select("id, name")
      .in("id", Array.from(propertyIds));
    props?.forEach((p) => propertiesMap.set(p.id, p.name));
  }

  return {
    stats: {
      totalProperties: propertiesCount.count ?? 0,
      totalTenants: tenantsCount.count ?? 0,
      activeDeals: dealsCount.count ?? 0,
      totalRevenue,
      overdueInvoicesCount,
      openMaintenanceCount: openMaintenanceRes.count ?? 0,
    },
    revenueExpensesData,
    dealsByStageData,
    leaseExpiries: (leaseExpiriesRes.data ?? []).map((t) => ({
      full_name: t.full_name,
      lease_end: t.lease_end,
    })),
    overdueInvoicesCount,
    totalOverdueAmount,
    pdcsDueCount: pdcsDue.length,
    pdcsDueTotal,
    recentLeads: recentLeadsRes.data ?? [],
    recentDeals: recentDealsRes.data ?? [],
    recentMaintenance: (recentMaintenanceRes.data ?? []).map((m) => ({
      title: m.title,
      reference: m.reference,
      status: m.status,
      propertyName: m.property_id ? propertiesMap.get(m.property_id) ?? "—" : "—",
    })),
  };
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Your property management at a glance
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <OverviewContent />
      </Suspense>
    </div>
  );
}

async function OverviewContent() {
  const data = await getOverviewData();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to see the overview.
        </p>
      </div>
    );
  }

  const { stats, revenueExpensesData, dealsByStageData, leaseExpiries, overdueInvoicesCount, totalOverdueAmount, pdcsDueCount, pdcsDueTotal, recentLeads, recentDeals, recentMaintenance } = data;

  const statCards = [
    {
      title: "Total Properties",
      value: stats.totalProperties,
      icon: Building2,
      desc: "All properties",
    },
    {
      title: "Total Tenants",
      value: stats.totalTenants,
      icon: Users,
      desc: "Active tenants",
    },
    {
      title: "Active Deals",
      value: stats.activeDeals,
      icon: Handshake,
      desc: "Not yet signed",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: Wallet,
      desc: "This month",
    },
    {
      title: "Overdue Invoices",
      value: stats.overdueInvoicesCount,
      icon: FileWarning,
      desc: "Require attention",
    },
    {
      title: "Open Maintenance",
      value: stats.openMaintenanceCount,
      icon: Wrench,
      desc: "Open or in progress",
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-muted-foreground text-xs">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <OverviewCharts
        revenueExpensesData={revenueExpensesData}
        dealsByStageData={dealsByStageData}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lease Expiries
            </CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{leaseExpiries.length}</p>
            <p className="text-muted-foreground text-xs">
              Tenants with lease ending within 30 days
            </p>
            {leaseExpiries.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {leaseExpiries.slice(0, 3).map((t) => (
                  <li key={t.lease_end + t.full_name}>
                    {t.full_name} — {formatDate(t.lease_end)}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/properties/tenants"
              className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
            >
              View tenants <ArrowRight className="ml-1 size-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Invoices
            </CardTitle>
            <AlertCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overdueInvoicesCount}</p>
            <p className="text-muted-foreground text-xs">
              Total overdue: {formatCurrency(totalOverdueAmount)}
            </p>
            <Link
              href="/accounts/invoices"
              className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
            >
              View invoices <ArrowRight className="ml-1 size-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              PDCs Due Soon
            </CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pdcsDueCount}</p>
            <p className="text-muted-foreground text-xs">
              Total amount: {formatCurrency(pdcsDueTotal)}
            </p>
            <Link
              href="/accounts/pdc"
              className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
            >
              View PDC <ArrowRight className="ml-1 size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Last 3 leads</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent leads</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentLeads.map((l, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-2">
                    <span className="font-medium">{l.full_name}</span>
                    <span className="text-muted-foreground">
                      {l.source ?? "—"} · {l.status}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(l.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Deals</CardTitle>
            <CardDescription>Last 3 deals</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDeals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent deals</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentDeals.map((d, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-2">
                    <span className="font-medium">{d.reference ?? "—"}</span>
                    <span className="text-muted-foreground capitalize">
                      {d.type ?? "—"} · {d.stage?.replace(/_/g, " ") ?? "—"}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(Number(d.value))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance</CardTitle>
            <CardDescription>Last 3 requests</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMaintenance.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No recent maintenance
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentMaintenance.map((m, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-2">
                    <span className="font-medium">{m.title}</span>
                    <span className="text-muted-foreground">
                      {m.propertyName} · {m.status.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
