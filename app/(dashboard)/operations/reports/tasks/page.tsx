import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { TasksReportClient } from "@/components/operations/reports/tasks-report-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { parseISO, isBefore } from "date-fns";

async function getTasksReportData() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      byStatus: [] as { name: string; value: number }[],
      overdueCount: 0,
      completionRate: 0,
      overdueTasks: [] as {
        id: string;
        reference: string;
        title: string;
        due_date: string | null;
        status: string;
      }[],
    };
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, reference, title, status, due_date")
    .eq("company_id", companyId);

  const list = tasks ?? [];
  const statusCounts: Record<string, number> = {};
  list.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
  });

  const byStatus = ["todo", "in_progress", "completed", "cancelled"].map(
    (name) => ({ name: name.replace("_", " "), value: statusCounts[name] ?? 0 })
  );

  const now = new Date();
  const overdueTasks = list.filter((t) => {
    if (t.status === "completed" || t.status === "cancelled") return false;
    if (!t.due_date) return false;
    return isBefore(parseISO(t.due_date), now);
  });
  const overdueCount = overdueTasks.length;
  const total = list.length;
  const completed = list.filter((t) => t.status === "completed").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    byStatus,
    overdueCount,
    completionRate,
    overdueTasks: overdueTasks.map((t) => ({
      id: t.id,
      reference: t.reference,
      title: t.title,
      due_date: t.due_date,
      status: t.status,
    })),
  };
}

export default async function TasksReportPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/operations/reports">
          <ArrowLeft className="mr-2 size-4" />
          Back to reports
        </Link>
      </Button>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tasks Report</h2>
        <p className="text-muted-foreground">
          Tasks by status, overdue count, and completion rate
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <TasksReportContent />
      </Suspense>
    </div>
  );
}

async function TasksReportContent() {
  const { byStatus, overdueCount, completionRate, overdueTasks } =
    await getTasksReportData();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <TasksReportClient byStatus={byStatus} />
        <Card>
          <CardHeader>
            <CardTitle>Overdue tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completion rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {overdueTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overdue tasks list</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {overdueTasks.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{t.reference}</td>
                      <td className="py-3">{t.title}</td>
                      <td className="py-3 text-destructive">
                        {t.due_date ? formatDate(t.due_date) : "—"}
                      </td>
                      <td className="py-3">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
