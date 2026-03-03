import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { TasksTable } from "@/components/operations/tasks-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type TasksSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
  priority?: string;
  project?: string;
};

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

async function getTasksData(searchParams: TasksSearchParams) {
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
      totalCount: 0,
      page: 1,
      pageSize: 10,
    };
  }

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize ?? "10", 10) || 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = (searchParams.search ?? "").trim();
  const statusFilter = searchParams.status ?? "all";
  const priorityFilter = searchParams.priority ?? "all";
  const projectFilter = searchParams.project ?? "all";

  let query = supabase
    .from("tasks")
    .select("id, reference, title, description, project_id, assigned_to, priority, status, due_date", { count: "exact" })
    .eq("company_id", companyId)
    .order("due_date", { ascending: true });

  if (search) {
    query = query.or(`title.ilike.%${search}%,reference.ilike.%${search}%`);
  }
  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
  if (projectFilter !== "all") query = query.eq("project_id", projectFilter);

  const [tasksRes, projectsRes, profilesRes] = await Promise.all([
    query.range(from, to),
    supabase.from("projects").select("id, reference, name").eq("company_id", companyId),
    supabase.from("profiles").select("id, full_name").eq("company_id", companyId),
  ]);

  const count = tasksRes.count ?? 0;
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
    totalCount: count,
    page,
    pageSize,
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

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<TasksSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            Manage tasks and track progress
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<TasksTableSkeleton />}>
          <TasksContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function TasksContent({ params }: { params: TasksSearchParams }) {
  const { tasks, companyId, projects, profiles, totalCount, page, pageSize } =
    await getTasksData(params);

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
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        status: params.status ?? "all",
        priority: params.priority ?? "all",
        project: params.project ?? "all",
      }}
    />
  );
}
