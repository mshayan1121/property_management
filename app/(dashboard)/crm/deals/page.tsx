import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { DealsPageClient } from "./page-client";

async function getDealsData() {
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
    };
  }

  const [dealsRes, leadsRes, contactsRes, profilesRes] = await Promise.all([
    supabase
      .from("deals")
      .select("id, reference, type, stage, value, commission_amount, payment_type, contact_id, assigned_to, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
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
  };
}

export default async function DealsPage() {
  return (
    <Suspense fallback={<DealsPageSkeleton />}>
      <DealsContent />
    </Suspense>
  );
}

async function DealsContent() {
  const { deals, leads, contacts, profiles, companyId } =
    await getDealsData();

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
