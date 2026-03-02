import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export type SearchResultCategory =
  | "properties"
  | "tenants"
  | "contacts"
  | "deals"
  | "invoices"
  | "maintenance";

export interface SearchResultItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  category: SearchResultCategory;
}

export interface SearchResults {
  properties: SearchResultItem[];
  tenants: SearchResultItem[];
  contacts: SearchResultItem[];
  deals: SearchResultItem[];
  invoices: SearchResultItem[];
  maintenance: SearchResultItem[];
}

const MAX_PER_CATEGORY = 3;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  const companyId = profile?.company_id;
  if (!companyId) {
    return NextResponse.json(
      { error: "No company assigned" },
      { status: 400 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({
      properties: [],
      tenants: [],
      contacts: [],
      deals: [],
      invoices: [],
      maintenance: [],
    } satisfies SearchResults);
  }

  const term = `%${q}%`;

  const [
    propertiesRes,
    tenantsRes,
    contactsRes,
    dealsRes,
    invoicesRes,
    maintenanceRes,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name, location")
      .eq("company_id", companyId)
      .or(`name.ilike.${term},location.ilike.${term}`)
      .limit(MAX_PER_CATEGORY),
    supabase
      .from("tenants")
      .select("id, full_name, email, phone")
      .eq("company_id", companyId)
      .or(`full_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`)
      .limit(MAX_PER_CATEGORY),
    supabase
      .from("contacts")
      .select("id, full_name, email")
      .eq("company_id", companyId)
      .or(`full_name.ilike.${term},email.ilike.${term}`)
      .limit(MAX_PER_CATEGORY),
    supabase
      .from("deals")
      .select("id, reference, notes")
      .eq("company_id", companyId)
      .or(`reference.ilike.${term},notes.ilike.${term}`)
      .limit(MAX_PER_CATEGORY),
    supabase
      .from("invoices")
      .select("id, reference")
      .eq("company_id", companyId)
      .ilike("reference", term)
      .limit(MAX_PER_CATEGORY),
    supabase
      .from("maintenance_requests")
      .select("id, title, reference")
      .eq("company_id", companyId)
      .or(`title.ilike.${term},reference.ilike.${term}`)
      .limit(MAX_PER_CATEGORY),
  ]);

  const results: SearchResults = {
    properties: (propertiesRes.data ?? []).map((p) => ({
      id: p.id,
      label: p.name,
      sublabel: p.location,
      href: "/properties/listings",
      category: "properties" as const,
    })),
    tenants: (tenantsRes.data ?? []).map((t) => ({
      id: t.id,
      label: t.full_name,
      sublabel: t.email ?? t.phone ?? undefined,
      href: "/properties/tenants",
      category: "tenants" as const,
    })),
    contacts: (contactsRes.data ?? []).map((c) => ({
      id: c.id,
      label: c.full_name,
      sublabel: c.email ?? undefined,
      href: "/crm/contacts",
      category: "contacts" as const,
    })),
    deals: (dealsRes.data ?? []).map((d) => ({
      id: d.id,
      label: d.reference ?? d.id,
      sublabel: d.notes ?? undefined,
      href: "/crm/deals",
      category: "deals" as const,
    })),
    invoices: (invoicesRes.data ?? []).map((i) => ({
      id: i.id,
      label: i.reference,
      href: "/accounts/invoices",
      category: "invoices" as const,
    })),
    maintenance: (maintenanceRes.data ?? []).map((m) => ({
      id: m.id,
      label: m.title,
      sublabel: m.reference ?? undefined,
      href: "/operations/maintenance",
      category: "maintenance" as const,
    })),
  };

  return NextResponse.json(results);
}
