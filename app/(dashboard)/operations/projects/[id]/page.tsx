import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProjectDetailClient } from "@/components/operations/project-detail-client";
import { ArrowLeft } from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

async function getProjectDetail(projectId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) return null;

  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("company_id", companyId)
    .single();

  if (projError || !project) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, reference, title, priority, status, due_date, assigned_to")
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .order("due_date", { ascending: true });

  const taskList = tasks ?? [];
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter((t) => t.status === "completed").length;
  const completionPct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let propertyName: string | null = null;
  if (project.property_id) {
    const { data: prop } = await supabase
      .from("properties")
      .select("name")
      .eq("id", project.property_id)
      .single();
    propertyName = prop?.name ?? null;
  }

  const profileIds = [
    ...new Set(
      taskList
        .map((t) => t.assigned_to)
        .filter((id): id is string => !!id)
        .concat(project.assigned_to ? [project.assigned_to] : [])
    ),
  ];
  const { data: profilesData } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds)
      : { data: [] };
  const profilesMap = new Map(
    (profilesData ?? []).map((p) => [p.id, p.full_name])
  );

  return {
    project: {
      id: project.id,
      reference: project.reference,
      name: project.name,
      description: project.description,
      property_id: project.property_id,
      property_name: propertyName,
      category: project.category,
      priority: project.priority,
      status: project.status,
      start_date: project.start_date,
      due_date: project.due_date,
      budget: Number(project.budget),
      assigned_to: project.assigned_to,
      assigned_name: project.assigned_to
        ? profilesMap.get(project.assigned_to) ?? null
        : null,
    },
    stats: { totalTasks, completedTasks, completionPct },
    tasks: taskList.map((t) => ({
      ...t,
      due_date: t.due_date,
      assigned_name: t.assigned_to ? profilesMap.get(t.assigned_to) ?? null : null,
    })),
    companyId,
    profiles: Array.from(profilesMap.entries()).map(([id, full_name]) => ({
      id,
      full_name,
    })),
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProjectDetail(id);
  if (!data) notFound();

  const { project, stats, tasks, companyId, profiles } = data;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/operations/projects">
            <ArrowLeft className="mr-2 size-4" />
            Back to projects
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
          <Badge variant="secondary">{project.reference}</Badge>
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
              PRIORITY_COLORS[project.priority] ?? "bg-muted"
            }`}
          >
            {project.priority}
          </span>
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
              STATUS_COLORS[project.status] ?? "bg-muted"
            }`}
          >
            {project.status.replace("_", " ")}
          </span>
        </div>
        <p className="mt-1 text-muted-foreground text-sm">
          {project.property_name && `Property: ${project.property_name}`}
          {project.category && ` · ${project.category}`}
          {project.assigned_name && ` · Assigned to ${project.assigned_name}`}
        </p>
        {project.description && (
          <p className="mt-2 text-sm">{project.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {project.start_date && (
            <span>Start: {formatDate(project.start_date)}</span>
          )}
          {project.due_date && (
            <span>Due: {formatDate(project.due_date)}</span>
          )}
          <span>Budget: {formatCurrency(project.budget)}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completedTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completionPct}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-4">
          <ProjectDetailClient
            projectId={project.id}
            initialTasks={tasks}
            companyId={companyId}
            profiles={profiles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
