import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DealDetailClient } from "./deal-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: PageProps) {
  const { id } = await params;
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
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to view deals.
        </p>
      </div>
    );
  }

  const { data: deal } = await supabase
    .from("deals")
    .select(
      `
      id,
      reference,
      lead_id,
      contact_id,
      type,
      stage,
      value,
      commission_rate,
      commission_amount,
      payment_type,
      assigned_to,
      notes,
      created_at,
      updated_at
    `
    )
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  if (!deal) {
    notFound();
  }

  const [contactRes, leadRes, assigneeRes, kycRes, contractsRes] =
    await Promise.all([
      deal.contact_id
        ? supabase
            .from("contacts")
            .select("id, full_name, email, phone")
            .eq("id", deal.contact_id)
            .single()
        : Promise.resolve({ data: null }),
      deal.lead_id
        ? supabase
            .from("leads")
            .select("id, full_name, email, phone")
            .eq("id", deal.lead_id)
            .single()
        : Promise.resolve({ data: null }),
      deal.assigned_to
        ? supabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", deal.assigned_to)
            .single()
        : Promise.resolve({ data: null }),
      supabase
        .from("kyc_documents")
        .select("id, name, file_url, file_type, created_at")
        .eq("deal_id", deal.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("contracts")
        .select("id, reference, status")
        .eq("deal_id", deal.id),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/crm/deals">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {deal.reference ?? "Deal"}
          </h2>
          <p className="text-muted-foreground">
            {deal.type ? (
              <span className="capitalize">{deal.type}</span>
            ) : (
              "-"
            )}{" "}
            ·{" "}
            {deal.stage ? (
              <span className="capitalize">
                {(deal.stage as string).replace(/_/g, " ")}
              </span>
            ) : (
              "-"
            )}
          </p>
        </div>
      </div>

      <DealDetailClient
        deal={deal}
        contact={contactRes.data}
        lead={leadRes.data}
        assignee={assigneeRes.data}
        kycDocuments={kycRes.data ?? []}
        linkedContracts={contractsRes.data ?? []}
        companyId={companyId}
      />
    </div>
  );
}
