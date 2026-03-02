import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementsTable } from "@/components/operations/announcements-table";

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

async function getAnnouncementsData() {
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
    };
  }

  const [announcementsRes, propertiesRes] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, content, type, property_id, status, published_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("properties")
      .select("id, reference, name")
      .eq("company_id", companyId),
  ]);

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

export default async function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
        <p className="text-muted-foreground">
          Create and manage company announcements
        </p>
      </div>

      <Suspense fallback={<AnnouncementsTableSkeleton />}>
        <AnnouncementsContent />
      </Suspense>
    </div>
  );
}

async function AnnouncementsContent() {
  const { announcements, companyId, properties } =
    await getAnnouncementsData();

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
    />
  );
}
