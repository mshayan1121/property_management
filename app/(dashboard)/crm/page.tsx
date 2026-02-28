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
import { CrmDashboardClient } from "@/components/crm/crm-dashboard-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const getCrmStats = cache(async () => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      totalLeads: 0,
      qualifiedLeads: 0,
      totalDeals: 0,
      winRate: 0,
      leadsBySource: [] as { name: string; value: number }[],
      dealsByStage: [] as { name: string; value: number }[],
      recentLeads: [] as {
        id: string;
        full_name: string;
        source: string | null;
        status: string;
        created_at: string;
      }[],
    };
  }

  const [leadsRes, qualifiedRes, dealsRes, wonRes, leadsSourceRes, dealsStageRes, recentLeadsRes] =
    await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "qualified"),
      supabase.from("deals").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("stage", "contract_signed"),
      supabase.from("leads").select("source").eq("company_id", companyId),
      supabase.from("deals").select("stage").eq("company_id", companyId),
      supabase
        .from("leads")
        .select("id, full_name, source, status, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const totalLeads = leadsRes.count ?? 0;
  const qualifiedLeads = qualifiedRes.count ?? 0;
  const totalDeals = dealsRes.count ?? 0;
  const wonDeals = wonRes.count ?? 0;
  const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

  const sourceCounts: Record<string, number> = {};
  (leadsSourceRes.data ?? []).forEach((r) => {
    const s = r.source ?? "other";
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1;
  });
  const leadsBySource = Object.entries(sourceCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const stageCounts: Record<string, number> = {};
  (dealsStageRes.data ?? []).forEach((r) => {
    const s = r.stage ?? "unknown";
    stageCounts[s] = (stageCounts[s] ?? 0) + 1;
  });
  const stageOrder = ["qualified", "viewed", "negotiation", "contract_draft", "contract_signed"];
  const dealsByStage = stageOrder
    .filter((s) => (stageCounts[s] ?? 0) > 0)
    .map((s) => ({
      name: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: stageCounts[s] ?? 0,
    }));

  const recentLeads = recentLeadsRes.data ?? [];

  return {
    totalLeads,
    qualifiedLeads,
    totalDeals,
    winRate,
    leadsBySource,
    dealsByStage,
    recentLeads,
  };
});

export default async function CrmDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CRM</h2>
          <p className="text-muted-foreground">Customer relationship management at a glance</p>
        </div>
      </div>

      <Suspense fallback={<CrmStatsSkeleton />}>
        <CrmStatsCards />
      </Suspense>

      <Suspense fallback={<CrmChartsSkeleton />}>
        <CrmCharts />
      </Suspense>

      <Suspense fallback={<RecentLeadsSkeleton />}>
        <RecentLeadsTable />
      </Suspense>
    </div>
  );
}

async function CrmStatsCards() {
  const stats = await getCrmStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalLeads}</p>
          <p className="text-muted-foreground text-xs">All leads</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.qualifiedLeads}</p>
          <p className="text-muted-foreground text-xs">Status: qualified</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalDeals}</p>
          <p className="text-muted-foreground text-xs">Active and won</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.winRate}%</p>
          <p className="text-muted-foreground text-xs">Deals in contract_signed</p>
        </CardContent>
      </Card>
    </div>
  );
}

function CrmStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-12" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function CrmCharts() {
  const stats = await getCrmStats();

  return (
    <CrmDashboardClient
      leadsBySource={stats.leadsBySource}
      dealsByStage={stats.dealsByStage}
    />
  );
}

function CrmChartsSkeleton() {
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

async function RecentLeadsTable() {
  const stats = await getCrmStats();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>Last 5 leads added</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href="/crm/leads">
            <Plus className="mr-2 size-4" />
            Add Lead
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {stats.recentLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <p className="text-muted-foreground text-sm">No leads yet</p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/crm/leads">Add your first lead</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">Name</th>
                  <th className="pb-2 text-left font-medium">Source</th>
                  <th className="pb-2 text-left font-medium">Status</th>
                  <th className="pb-2 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/crm/leads?lead=${lead.id}`}
                        className="font-medium hover:underline"
                      >
                        {lead.full_name}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {(lead.source ?? "-").charAt(0).toUpperCase() +
                        (lead.source ?? "-").slice(1)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          lead.status === "qualified"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : lead.status === "contacted"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : lead.status === "lost"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentLeadsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  );
}
