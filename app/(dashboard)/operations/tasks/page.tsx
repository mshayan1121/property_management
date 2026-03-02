import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { TasksTable } from "@/components/operations/tasks-table";

type TaskRow = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  project_id: string | null;
  project_name: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  priority: string;
  status: string;
  due_date: string | null;
};

async function getTasksData() {
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
    return {
      tasks: [] as TaskRow[],
      projects: [] as { id: string; reference: string; name: string }[],
      profiles: [] as { id: string; full_name: string }[],
      companyId: "",
    };
  }

  const [tasksRes, projectsRes, profilesRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, reference, title, description, project_id, assigned_to, priority, status, due_date")
      .eq("company_id", companyId)
      .order("due_date", { ascending: true }),
    supabase
      .from("projects")
      .select("id, reference, name")
      .eq("company_id", companyId),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", companyId),
  ]);

  const projectsMap = new Map(
    (projectsRes.data ?? []).map((p) => [p.id, p.name])
  );
  const profileIds = [
    ...new Set(
      (tasksRes.data ?? [])
        .map((t) => t.assigned_to)
        .filter((id): id is string => !!id)
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

  const tasks: TaskRow[] = (tasksRes.data ?? []).map((t) => ({
    ...t,
    project_name: t.project_id ? projectsMap.get(t.project_id) ?? null : null,
    assigned_name: t.assigned_to ? profilesMap.get(t.assigned_to) ?? null : null,
  }));

  return {
    tasks,
    projects: projectsRes.data ?? [],
    profiles: profilesRes.data ?? [],
    companyId,
  };
}

function TasksTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground">
          Manage tasks and track progress
        </p>
      </div>

      <Suspense fallback={<TasksTableSkeleton />}>
        <TasksContent />
      </Suspense>
    </div>
  );
}

async function TasksContent() {
  const { tasks, companyId, projects, profiles } = await getTasksData();

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage tasks.
        </p>
      </div>
    );
  }

  return (
    <TasksTable
      initialTasks={tasks}
      companyId={companyId}
      projects={projects}
      profiles={profiles}
    />
  );
}
