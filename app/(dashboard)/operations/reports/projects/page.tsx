import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProjectsReportClient } from "@/components/operations/reports/projects-report-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

async function getProjectsReportData() {
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
      byCategory: [] as { name: string; value: number }[],
      projects: [] as {
        id: string;
        reference: string;
        name: string;
        status: string;
        category: string | null;
        due_date: string | null;
        budget: number;
        completionPct: number;
      }[],
    };
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, reference, name, status, category, due_date, budget")
    .eq("company_id", companyId);

  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: tasksByProject } =
    projectIds.length > 0
      ? await supabase
          .from("tasks")
          .select("project_id, status")
          .in("project_id", projectIds)
      : { data: [] };

  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  (projects ?? []).forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    const cat = p.category ?? "other";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  });

  const byStatus = ["pending", "in_progress", "completed", "cancelled"].map(
    (name) => ({ name: name.replace("_", " "), value: statusCounts[name] ?? 0 })
  );
  const byCategory = [
    "maintenance",
    "renovation",
    "inspection",
    "construction",
    "other",
  ].map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: categoryCounts[name] ?? 0,
  }));

  const totalByProject: Record<string, number> = {};
  const completedByProject: Record<string, number> = {};
  (tasksByProject ?? []).forEach((t) => {
    if (!t.project_id) return;
    totalByProject[t.project_id] = (totalByProject[t.project_id] ?? 0) + 1;
    if (t.status === "completed") {
      completedByProject[t.project_id] =
        (completedByProject[t.project_id] ?? 0) + 1;
    }
  });

  const projectsWithPct = (projects ?? []).map((p) => {
    const total = totalByProject[p.id] ?? 0;
    const completed = completedByProject[p.id] ?? 0;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      id: p.id,
      reference: p.reference,
      name: p.name,
      status: p.status,
      category: p.category,
      due_date: p.due_date,
      budget: Number(p.budget),
      completionPct,
    };
  });

  return { byStatus, byCategory, projects: projectsWithPct };
}

export default async function ProjectsReportPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/operations/reports">
          <ArrowLeft className="mr-2 size-4" />
          Back to reports
        </Link>
      </Button>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Projects Report</h2>
        <p className="text-muted-foreground">
          Projects by status, category, and completion
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <ProjectsReportContent />
      </Suspense>
    </div>
  );
}

async function ProjectsReportContent() {
  const { byStatus, byCategory, projects } = await getProjectsReportData();

  return (
    <>
      <ProjectsReportClient byStatus={byStatus} byCategory={byCategory} />
      <Card>
        <CardHeader>
          <CardTitle>All projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">Reference</th>
                    <th className="pb-2 text-left font-medium">Name</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                    <th className="pb-2 text-left font-medium">Category</th>
                    <th className="pb-2 text-left font-medium">Due date</th>
                    <th className="pb-2 text-right font-medium">Budget (AED)</th>
                    <th className="pb-2 text-right font-medium">Completion %</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No projects
                      </td>
                    </tr>
                  ) : (
                    projects.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{p.reference}</td>
                        <td className="py-3">{p.name}</td>
                        <td className="py-3 capitalize">{p.status.replace("_", " ")}</td>
                        <td className="py-3 capitalize">{p.category ?? "—"}</td>
                        <td className="py-3 text-muted-foreground">
                          {p.due_date ? formatDate(p.due_date) : "—"}
                        </td>
                        <td className="py-3 text-right">
                          {formatCurrency(p.budget)}
                        </td>
                        <td className="py-3 text-right">{p.completionPct}%</td>
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
