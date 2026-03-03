import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementsTable } from "@/components/operations/announcements-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type AnnouncementsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  type?: string;
  status?: string;
};

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  type: string;
  property_id: string | null;
  property_name: string | null;
  status: string;
  published_at: string | null;
};

async function getAnnouncementsData(searchParams: AnnouncementsSearchParams) {
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
      announcements: [] as AnnouncementRow[],
      properties: [] as { id: string; reference: string; name: string }[],
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
  const typeFilter = searchParams.type ?? "all";
  const statusFilter = searchParams.status ?? "all";

  let query = supabase
    .from("announcements")
    .select("id, title, content, type, property_id, status, published_at", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }
  if (typeFilter !== "all") query = query.eq("type", typeFilter);
  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const [announcementsRes, propertiesRes] = await Promise.all([
    query.range(from, to),
    supabase.from("properties").select("id, reference, name").eq("company_id", companyId),
  ]);

  const count = announcementsRes.count ?? 0;
  const propertiesMap = new Map(
    (propertiesRes.data ?? []).map((p) => [p.id, p.name])
  );

  const announcements: AnnouncementRow[] = (announcementsRes.data ?? []).map(
    (a) => ({
      ...a,
      property_name: a.property_id ? propertiesMap.get(a.property_id) ?? null : null,
    })
  );

  return {
    announcements,
    properties: propertiesRes.data ?? [],
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

function AnnouncementsTableSkeleton() {
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

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<AnnouncementsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">
            Create and manage company announcements
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<AnnouncementsTableSkeleton />}>
          <AnnouncementsContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function AnnouncementsContent({ params }: { params: AnnouncementsSearchParams }) {
  const { announcements, companyId, properties, totalCount, page, pageSize } =
    await getAnnouncementsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage announcements.
        </p>
      </div>
    );
  }

  return (
    <AnnouncementsTable
      initialAnnouncements={announcements}
      companyId={companyId}
      properties={properties}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        type: params.type ?? "all",
        status: params.status ?? "all",
      }}
    />
  );
}
