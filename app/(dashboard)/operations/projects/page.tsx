import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectsTable } from "@/components/operations/projects-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type ProjectsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
};

type ProjectRow = {
  id: string;
  reference: string;
  name: string;
  description: string | null;
  property_id: string | null;
  property_name: string | null;
  category: string | null;
  priority: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
  budget: number;
  assigned_to: string | null;
};

async function getProjectsData(searchParams: ProjectsSearchParams) {
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
      projects: [] as ProjectRow[],
      properties: [] as { id: string; reference: string; name: string }[],
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
  const categoryFilter = searchParams.category ?? "all";
  const priorityFilter = searchParams.priority ?? "all";

  let query = supabase
    .from("projects")
    .select("id, reference, name, description, property_id, category, priority, status, start_date, due_date, budget, assigned_to", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,reference.ilike.%${search}%`);
  }
  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (categoryFilter !== "all") query = query.eq("category", categoryFilter);
  if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);

  const [projectsRes, propertiesRes, profilesRes] = await Promise.all([
    query.range(from, to),
    supabase.from("properties").select("id, reference, name").eq("company_id", companyId),
    supabase.from("profiles").select("id, full_name").eq("company_id", companyId),
  ]);

  const count = projectsRes.count ?? 0;
  const propertiesMap = new Map(
    (propertiesRes.data ?? []).map((p) => [p.id, p.name])
  );

  const projects: ProjectRow[] = (projectsRes.data ?? []).map((p) => ({
    ...p,
    budget: Number(p.budget),
    property_name: p.property_id ? propertiesMap.get(p.property_id) ?? null : null,
  }));

  return {
    projects,
    properties: propertiesRes.data ?? [],
    profiles: profilesRes.data ?? [],
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

function ProjectsTableSkeleton() {
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

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<ProjectsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage operations projects and track progress
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<ProjectsTableSkeleton />}>
          <ProjectsContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function ProjectsContent({ params }: { params: ProjectsSearchParams }) {
  const { projects, companyId, properties, profiles, totalCount, page, pageSize } =
    await getProjectsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage projects.
        </p>
      </div>
    );
  }

  return (
    <ProjectsTable
      initialProjects={projects}
      companyId={companyId}
      properties={properties}
      profiles={profiles}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        status: params.status ?? "all",
        category: params.category ?? "all",
        priority: params.priority ?? "all",
      }}
    />
  );
}
