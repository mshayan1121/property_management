import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportView } from "@/components/properties/reports/report-view";

const VALID_TYPES = [
  "portfolio-overview",
  "monthly-contracts",
  "revenue",
  "vacancy-loss",
  "lease-expiry",
  "rent-collection",
  "property-performance",
  "occupancy-rate",
  "portfolio-summary",
] as const;

export type ReportType = (typeof VALID_TYPES)[number];

async function getReportData(type: ReportType, companyId: string) {
  const supabase = await createClient();

  if (type === "portfolio-overview" || type === "portfolio-summary" || type === "property-performance" || type === "revenue" || type === "vacancy-loss" || type === "occupancy-rate") {
    const [propertiesRes, unitsRes, tenantsRes] = await Promise.all([
      supabase.from("properties").select("id, name, type, location, total_units, status").eq("company_id", companyId),
      supabase.from("units").select("id, property_id, status, rent_amount").eq("company_id", companyId),
      supabase.from("tenants").select("id, unit_id, monthly_rent, status").eq("company_id", companyId).eq("status", "active"),
    ]);
    const properties = propertiesRes.data ?? [];
    const units = unitsRes.data ?? [];
    const tenants = tenantsRes.data ?? [];
    const unitToProperty = new Map(units.map((u) => [u.id, u.property_id]));
    const revenueByProperty: Record<string, number> = {};
    const occupiedByProperty: Record<string, number> = {};
    const totalUnitsByProperty: Record<string, number> = {};
    units.forEach((u) => {
      totalUnitsByProperty[u.property_id] = (totalUnitsByProperty[u.property_id] ?? 0) + 1;
      if (u.status === "occupied") occupiedByProperty[u.property_id] = (occupiedByProperty[u.property_id] ?? 0) + 1;
    });
    tenants.forEach((t) => {
      const propId = t.unit_id ? unitToProperty.get(t.unit_id) : null;
      if (propId) revenueByProperty[propId] = (revenueByProperty[propId] ?? 0) + t.monthly_rent;
    });
    const totalRevenue = tenants.reduce((s, t) => s + t.monthly_rent, 0);
    const totalUnits = units.length;
    const occupiedUnits = units.filter((u) => u.status === "occupied").length;
    const vacancyRate = totalUnits > 0 ? Math.round(((totalUnits - occupiedUnits) / totalUnits) * 100) : 0;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const vacantUnitsList = units.filter((u) => u.status === "vacant");
    const vacancyLoss = vacantUnitsList.reduce((s, u) => s + (u.rent_amount ?? 0), 0);
    const propertyMetrics = properties.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      totalUnits: totalUnitsByProperty[p.id] ?? 0,
      occupied: occupiedByProperty[p.id] ?? 0,
      revenue: revenueByProperty[p.id] ?? 0,
      occupancyPct: totalUnitsByProperty[p.id] ? Math.round(((occupiedByProperty[p.id] ?? 0) / (totalUnitsByProperty[p.id] ?? 1)) * 100) : 0,
    }));
    const revenueByPropertyChart = propertyMetrics.map((p) => ({ name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name, value: p.revenue }));

    if (type === "portfolio-overview") {
      return {
        totalProperties: properties.length,
        totalUnits,
        occupancyRate,
        totalMonthlyRevenue: totalRevenue,
        revenueByProperty: revenueByPropertyChart,
        propertyMetrics,
      };
    }
    if (type === "portfolio-summary") {
      return {
        totalProperties: properties.length,
        totalUnits,
        occupiedUnits,
        vacantUnits: totalUnits - occupiedUnits,
        occupancyRate,
        vacancyRate,
        totalMonthlyRevenue: totalRevenue,
        propertyMetrics,
      };
    }
    if (type === "property-performance") {
      return {
        propertyMetrics,
        revenueByProperty: revenueByPropertyChart,
      };
    }
    if (type === "revenue") {
      return {
        totalRevenue,
        propertyMetrics,
        revenueByProperty: revenueByPropertyChart,
      };
    }
    if (type === "vacancy-loss") {
      const { data: unitsWithNumber } = await supabase.from("units").select("id, unit_number, property_id, rent_amount").in("id", vacantUnitsList.map((u) => u.id));
      const vacantWithName = (unitsWithNumber ?? []).map((u) => ({
        id: u.id,
        unit_number: u.unit_number,
        property_id: u.property_id,
        rent_amount: u.rent_amount,
        propertyName: properties.find((p) => p.id === u.property_id)?.name ?? "-",
      }));
      return {
        vacantCount: vacantUnitsList.length,
        vacancyLoss,
        vacantUnits: vacantWithName,
        properties,
      };
    }
    if (type === "occupancy-rate") {
      return {
        occupancyRate,
        propertyMetrics,
        totalUnits,
        occupiedUnits,
      };
    }
  }

  if (type === "lease-expiry") {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, reference, full_name, unit_id, lease_end, monthly_rent, status")
      .eq("company_id", companyId)
      .in("status", ["active", "expired"]);
    const units = await supabase.from("units").select("id, unit_number, property_id").eq("company_id", companyId);
    const properties = await supabase.from("properties").select("id, name").eq("company_id", companyId);
    const unitMap = new Map((units.data ?? []).map((u) => [u.id, u]));
    const propMap = new Map((properties.data ?? []).map((p) => [p.id, p.name]));
    const now = new Date();
    const in30 = (d: string) => {
      const end = new Date(d);
      const days = Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return days >= 0 && days <= 30;
    };
    const in60 = (d: string) => {
      const end = new Date(d);
      const days = Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return days >= 0 && days <= 60;
    };
    const in90 = (d: string) => {
      const end = new Date(d);
      const days = Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return days >= 0 && days <= 90;
    };
    const list = (tenants ?? []).map((t) => {
      const u = t.unit_id ? unitMap.get(t.unit_id) : null;
      const days = t.lease_end ? Math.ceil((new Date(t.lease_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 0;
      return {
        ...t,
        unit_number: u?.unit_number ?? "-",
        property_name: u ? propMap.get(u.property_id) ?? "-" : "-",
        daysUntilExpiry: days,
      };
    });
    return {
      in30: list.filter((t) => in30(t.lease_end)),
      in60: list.filter((t) => in60(t.lease_end)),
      in90: list.filter((t) => in90(t.lease_end)),
      all: list,
    };
  }

  if (type === "monthly-contracts") {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, lease_start, lease_end")
      .eq("company_id", companyId);
    const byMonth: Record<string, number> = {};
    (tenants ?? []).forEach((t) => {
      const m = t.lease_start?.slice(0, 7) ?? "";
      if (m) byMonth[m] = (byMonth[m] ?? 0) + 1;
    });
    const monthlyData = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
    return { monthlyData, table: monthlyData };
  }

  if (type === "rent-collection") {
    return {
      message: "Rent collection uses invoices from Phase 4 (Accounts & Finance).",
      paid: 0,
      unpaid: 0,
      collectionRate: 0,
      tenants: [],
    };
  }

  return null;
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as ReportType)) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();
  const companyId = profile?.company_id;
  if (!companyId) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
        You need to be assigned to a company to view reports.
      </div>
    );
  }

  const data = await getReportData(type as ReportType, companyId);
  const title = type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">Property report</p>
      </div>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ReportView type={type as ReportType} data={data} />
      </Suspense>
    </div>
  );
}
