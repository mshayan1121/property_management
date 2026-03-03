import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { DealsPageClient } from "./page-client";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type DealsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  type?: string;
  stage?: string;
  assignee?: string;
};

async function getDealsData(searchParams: DealsSearchParams) {
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
      deals: [] as {
        id: string;
        reference: string | null;
        type: string | null;
        stage: string | null;
        value: number;
        payment_type: string | null;
        contact_name: string | null;
        commission_amount: number;
        assigned_to_name: string | null;
        created_at: string;
      }[],
      leads: [] as { id: string; full_name: string }[],
      contacts: [] as { id: string; full_name: string }[],
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
  const typeFilter = searchParams.type ?? "all";
  const stageFilter = searchParams.stage ?? "all";
  const assigneeFilter = searchParams.assignee ?? "all";

  let query = supabase
    .from("deals")
    .select("id, reference, type, stage, value, commission_amount, payment_type, contact_id, assigned_to, created_at", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`reference.ilike.%${search}%`);
  }
  if (typeFilter !== "all") {
    query = query.eq("type", typeFilter);
  }
  if (stageFilter !== "all") {
    query = query.eq("stage", stageFilter);
  }
  if (assigneeFilter !== "all") {
    query = query.eq("assigned_to", assigneeFilter);
  }

  const [dealsRes, leadsRes, contactsRes, profilesRes] = await Promise.all([
    query.range(from, to),
    supabase
      .from("leads")
      .select("id, full_name")
      .eq("company_id", companyId),
    supabase
      .from("contacts")
      .select("id, full_name")
      .eq("company_id", companyId),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", companyId),
  ]);

  const count = dealsRes.count ?? 0;
  const profilesMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p.full_name])
  );
  const contactsMap = new Map(
    (contactsRes.data ?? []).map((c) => [c.id, c.full_name])
  );

  const deals = (dealsRes.data ?? []).map((d) => ({
    ...d,
    contact_name: d.contact_id
      ? contactsMap.get(d.contact_id) ?? null
      : null,
    assigned_to_name: d.assigned_to
      ? profilesMap.get(d.assigned_to) ?? null
      : null,
  }));

  return {
    deals,
    leads: leadsRes.data ?? [],
    contacts: contactsRes.data ?? [],
    profiles: profilesRes.data ?? [],
    companyId,
    totalCount: count,
    page,
    pageSize,
  };
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<DealsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <Suspense key={JSON.stringify(params)} fallback={<DealsPageSkeleton />}>
        <DealsContent params={params} />
      </Suspense>
    </ErrorBoundary>
  );
}

async function DealsContent({ params }: { params: DealsSearchParams }) {
  const { deals, leads, contacts, profiles, companyId, totalCount, page, pageSize } =
    await getDealsData(params);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage deals.
        </p>
      </div>
    );
  }

  return (
    <DealsPageClient
      deals={deals}
      companyId={companyId}
      leads={leads}
      contacts={contacts}
      profiles={profiles}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        type: params.type ?? "all",
        stage: params.stage ?? "all",
        assignee: params.assignee ?? "all",
      }}
    />
  );
}

function DealsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
