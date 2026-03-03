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
import { formatDate } from "@/lib/utils";
import { PropertiesDashboardClient } from "@/components/properties/properties-dashboard-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";

const getPropertyStats = cache(async () => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      totalProperties: 0,
      totalUnits: 0,
      occupiedUnits: 0,
      vacancyRate: 0,
      propertiesByStatus: [] as { name: string; value: number }[],
      occupancyByProperty: [] as { name: string; occupied: number; total: number }[],
      recentProperties: [] as {
        id: string;
        reference: string;
        name: string;
        type: string | null;
        location: string;
        total_units: number;
        occupied: number;
        occupancyPct: number;
        status: string;
      }[],
    };
  }

  const [propertiesRes, unitsRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id, reference, name, type, location, total_units, status")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("units")
      .select("id, property_id, status")
      .eq("company_id", companyId),
  ]);

  const properties = propertiesRes.data ?? [];
  const units = unitsRes.data ?? [];

  const totalProperties = properties.length;
  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === "occupied").length;
  const vacancyRate = totalUnits > 0 ? Math.round(((totalUnits - occupiedUnits) / totalUnits) * 100) : 0;

  const statusCounts: Record<string, number> = {};
  properties.forEach((p) => {
    const s = p.status ?? "active";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  });
  const propertiesByStatus = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const occupiedByProperty: Record<string, number> = {};
  const totalByProperty: Record<string, number> = {};
  units.forEach((u) => {
    totalByProperty[u.property_id] = (totalByProperty[u.property_id] ?? 0) + 1;
    if (u.status === "occupied") {
      occupiedByProperty[u.property_id] = (occupiedByProperty[u.property_id] ?? 0) + 1;
    }
  });

  const propertyNames = new Map(properties.map((p) => [p.id, p.name]));
  const occupancyByProperty = properties
    .map((p) => ({
      name: p.name,
      occupied: occupiedByProperty[p.id] ?? 0,
      total: totalByProperty[p.id] ?? p.total_units,
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.occupied - a.occupied)
    .slice(0, 5)
    .map((x) => ({ ...x, name: x.name.length > 20 ? x.name.slice(0, 20) + "…" : x.name }));

  const recentProperties = properties.slice(0, 5).map((p) => {
    const total = totalByProperty[p.id] ?? p.total_units;
    const occupied = occupiedByProperty[p.id] ?? 0;
    const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return {
      id: p.id,
      reference: p.reference,
      name: p.name,
      type: p.type,
      location: p.location,
      total_units: total,
      occupied,
      occupancyPct,
      status: p.status,
    };
  });

  return {
    totalProperties,
    totalUnits,
    occupiedUnits,
    vacancyRate,
    propertiesByStatus,
    occupancyByProperty,
    recentProperties,
  };
});

export default async function PropertiesDashboardPage() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Properties</h2>
            <p className="text-muted-foreground">Property management at a glance</p>
          </div>
        </div>

        <Suspense fallback={<PropertiesStatsSkeleton />}>
          <PropertiesStatsCards />
        </Suspense>

        <Suspense fallback={<PropertiesChartsSkeleton />}>
          <PropertiesCharts />
        </Suspense>

      <Suspense fallback={<RecentPropertiesSkeleton />}>
        <RecentPropertiesTable />
      </Suspense>
    </div>
    </ErrorBoundary>
  );
}

async function PropertiesStatsCards() {
  const stats = await getPropertyStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalProperties}</p>
          <p className="text-muted-foreground text-xs">All properties</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Units</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalUnits}</p>
          <p className="text-muted-foreground text-xs">Across portfolio</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Occupied Units</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.occupiedUnits}</p>
          <p className="text-muted-foreground text-xs">Currently rented</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vacancy Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.vacancyRate}%</p>
          <p className="text-muted-foreground text-xs">Vacant units</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PropertiesStatsSkeleton() {
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

async function PropertiesCharts() {
  const stats = await getPropertyStats();

  return (
    <PropertiesDashboardClient
      propertiesByStatus={stats.propertiesByStatus}
      occupancyByProperty={stats.occupancyByProperty}
    />
  );
}

function PropertiesChartsSkeleton() {
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

async function RecentPropertiesTable() {
  const stats = await getPropertyStats();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Properties</CardTitle>
          <CardDescription>Last 5 properties added</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href="/properties/listings">
            <Plus className="mr-2 size-4" />
            Add Property
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {stats.recentProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <p className="text-muted-foreground text-sm">No properties yet</p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/properties/listings">Add your first property</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">Name</th>
                  <th className="pb-2 text-left font-medium">Type</th>
                  <th className="pb-2 text-left font-medium">Location</th>
                  <th className="pb-2 text-left font-medium">Units</th>
                  <th className="pb-2 text-left font-medium">Occupancy %</th>
                  <th className="pb-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentProperties.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/properties/listings/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {(p.type ?? "-").charAt(0).toUpperCase() + (p.type ?? "-").slice(1)}
                    </td>
                    <td className="py-3 text-muted-foreground">{p.location}</td>
                    <td className="py-3">{p.total_units}</td>
                    <td className="py-3">{p.occupancyPct}%</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          p.status === "active"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.status}
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
  );
}

function RecentPropertiesSkeleton() {
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
