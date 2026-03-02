import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MaintenanceReportClient } from "@/components/operations/reports/maintenance-report-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { parseISO, differenceInHours } from "date-fns";

async function getMaintenanceReportData() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      byCategory: [] as { name: string; value: number }[],
      avgResolutionHours: 0,
      totalEstimated: 0,
      totalActual: 0,
      requests: [] as {
        id: string;
        reference: string;
        title: string;
        category: string | null;
        status: string;
        estimated_cost: number;
        actual_cost: number;
      }[],
    };
  }

  const { data: requests } = await supabase
    .from("maintenance_requests")
    .select("id, reference, title, category, status, estimated_cost, actual_cost, created_at, updated_at")
    .eq("company_id", companyId);

  const list = requests ?? [];
  const categoryCounts: Record<string, number> = {};
  list.forEach((r) => {
    const cat = r.category ?? "other";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  });

  const byCategory = [
    "plumbing",
    "electrical",
    "hvac",
    "structural",
    "appliance",
    "cleaning",
    "other",
  ].map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: categoryCounts[name] ?? 0,
  }));

  const completed = list.filter((r) => r.status === "completed");
  let totalHours = 0;
  completed.forEach((r) => {
    const start = parseISO(r.created_at);
    const end = parseISO(r.updated_at);
    totalHours += differenceInHours(end, start);
  });
  const avgResolutionHours =
    completed.length > 0 ? Math.round(totalHours / completed.length) : 0;

  const totalEstimated = list.reduce((s, r) => s + Number(r.estimated_cost), 0);
  const totalActual = list.reduce((s, r) => s + Number(r.actual_cost), 0);

  return {
    byCategory,
    avgResolutionHours,
    totalEstimated,
    totalActual,
    requests: list.map((r) => ({
      id: r.id,
      reference: r.reference,
      title: r.title,
      category: r.category,
      status: r.status,
      estimated_cost: Number(r.estimated_cost),
      actual_cost: Number(r.actual_cost),
    })),
  };
}

export default async function MaintenanceReportPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/operations/reports">
          <ArrowLeft className="mr-2 size-4" />
          Back to reports
        </Link>
      </Button>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Maintenance Report</h2>
        <p className="text-muted-foreground">
          Requests by category, resolution time, and cost analysis
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <MaintenanceReportContent />
      </Suspense>
    </div>
  );
}

async function MaintenanceReportContent() {
  const {
    byCategory,
    avgResolutionHours,
    totalEstimated,
    totalActual,
    requests,
  } = await getMaintenanceReportData();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <MaintenanceReportClient byCategory={byCategory} />
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average resolution time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{avgResolutionHours} hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cost analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total estimated</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalEstimated)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Total actual</p>
              <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All maintenance requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">Reference</th>
                  <th className="pb-2 text-left font-medium">Title</th>
                  <th className="pb-2 text-left font-medium">Category</th>
                  <th className="pb-2 text-left font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Est. (AED)</th>
                  <th className="pb-2 text-right font-medium">Actual (AED)</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No requests
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{r.reference}</td>
                      <td className="py-3">{r.title}</td>
                      <td className="py-3 capitalize">{r.category ?? "—"}</td>
                      <td className="py-3">{r.status.replace("_", " ")}</td>
                      <td className="py-3 text-right">
                        {formatCurrency(r.estimated_cost)}
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(r.actual_cost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
