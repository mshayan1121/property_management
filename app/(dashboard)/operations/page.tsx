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
import { OperationsDashboardClient } from "@/components/operations/operations-dashboard-client";
import Link from "next/link";
import { ErrorBoundary } from "@/components/shared/error-boundary";

const getOperationsStats = cache(async () => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      totalProjects: 0,
      totalTasks: 0,
      openMaintenance: 0,
      completionRate: 0,
      projectsByStatus: [] as { name: string; value: number }[],
      projectsByCategory: [] as { name: string; value: number }[],
      recentMaintenance: [] as {
        id: string;
        reference: string;
        title: string;
        status: string;
        priority: string;
      }[],
      upcomingTasks: [] as {
        id: string;
        reference: string;
        title: string;
        due_date: string | null;
        status: string;
      }[],
    };
  }

  const [projectsRes, tasksRes, maintenanceRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, status, category")
      .eq("company_id", companyId),
    supabase
      .from("tasks")
      .select("id, status, due_date, reference, title")
      .eq("company_id", companyId),
    supabase
      .from("maintenance_requests")
      .select("id, reference, title, status, priority, created_at")
      .eq("company_id", companyId)
      .in("status", ["open", "assigned", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const projects = projectsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const openMaintenanceRes = await supabase
    .from("maintenance_requests")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["open", "assigned", "in_progress"]);
  const openMaintenance = openMaintenanceRes.count ?? 0;

  const statusCounts: Record<string, number> = {};
  projects.forEach((p) => {
    const st = p.status ?? "pending";
    statusCounts[st] = (statusCounts[st] ?? 0) + 1;
  });
  const projectsByStatus = [
    "pending",
    "in_progress",
    "completed",
    "cancelled",
  ].map((name) => ({
    name: name.replace("_", " "),
    value: statusCounts[name] ?? 0,
  }));

  const categoryCounts: Record<string, number> = {};
  projects.forEach((p) => {
    const cat = p.category ?? "other";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  });
  const projectsByCategory = [
    "maintenance",
    "renovation",
    "inspection",
    "construction",
    "other",
  ].map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: categoryCounts[name] ?? 0,
  }));

  const recentMaintenance = (maintenanceRes.data ?? []).map((m) => ({
    id: m.id,
    reference: m.reference,
    title: m.title,
    status: m.status,
    priority: m.priority,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const upcomingTasks = tasks
    .filter((t) => t.status !== "completed" && t.status !== "cancelled" && t.due_date && t.due_date >= today)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      reference: t.reference,
      title: t.title,
      due_date: t.due_date,
      status: t.status,
    }));

  return {
    totalProjects,
    totalTasks,
    openMaintenance,
    completionRate,
    projectsByStatus,
    projectsByCategory,
    recentMaintenance,
    upcomingTasks,
  };
});

export default async function OperationsDashboardPage() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Operations</h2>
          <p className="text-muted-foreground">
            Projects, tasks, maintenance, and operations overview
          </p>
        </div>

        <Suspense fallback={<OperationsStatsSkeleton />}>
          <OperationsStatsCards />
        </Suspense>

        <Suspense fallback={<OperationsChartsSkeleton />}>
          <OperationsCharts />
        </Suspense>

        <Suspense fallback={<OperationsTablesSkeleton />}>
          <OperationsTables />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function OperationsStatsCards() {
  const stats = await getOperationsStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalProjects}</p>
          <p className="text-muted-foreground text-xs">All projects</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalTasks}</p>
          <p className="text-muted-foreground text-xs">All tasks</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.openMaintenance}</p>
          <p className="text-muted-foreground text-xs">
            Open, assigned, or in progress
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.completionRate}%</p>
          <p className="text-muted-foreground text-xs">Completed tasks</p>
        </CardContent>
      </Card>
    </div>
  );
}

function OperationsStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function OperationsCharts() {
  const stats = await getOperationsStats();

  return (
    <OperationsDashboardClient
      projectsByStatus={stats.projectsByStatus}
      projectsByCategory={stats.projectsByCategory}
    />
  );
}

function OperationsChartsSkeleton() {
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

const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  open: "bg-muted text-muted-foreground",
  assigned: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

async function OperationsTables() {
  const stats = await getOperationsStats();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recent Maintenance Requests</CardTitle>
          <CardDescription>Last 5 open or in-progress requests</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentMaintenance.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No open maintenance requests
              </p>
              <Link
                href="/operations/maintenance"
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                View all maintenance
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">Reference</th>
                    <th className="pb-2 text-left font-medium">Title</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentMaintenance.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          href="/operations/maintenance"
                          className="font-medium hover:underline"
                        >
                          {m.reference}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground line-clamp-1">
                        {m.title}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            MAINTENANCE_STATUS_COLORS[m.status] ?? "bg-muted"
                          }`}
                        >
                          {m.status.replace("_", " ")}
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
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>Next 5 tasks by due date</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.upcomingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground text-sm">No upcoming tasks</p>
              <Link
                href="/operations/tasks"
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                View all tasks
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">Reference</th>
                    <th className="pb-2 text-left font-medium">Title</th>
                    <th className="pb-2 text-left font-medium">Due date</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.upcomingTasks.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          href="/operations/tasks"
                          className="font-medium hover:underline"
                        >
                          {t.reference}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground line-clamp-1">
                        {t.title}
                      </td>
                      <td className="py-3">
                        {t.due_date ? formatDate(t.due_date) : "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            TASK_STATUS_COLORS[t.status] ?? "bg-muted"
                          }`}
                        >
                          {t.status.replace("_", " ")}
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

function OperationsTablesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
