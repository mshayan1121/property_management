import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyDetailClient } from "@/components/properties/property-detail-client";

async function getPropertyDetail(propertyId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) return null;

  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("id, reference, name, type, location, address, total_units, status, images")
    .eq("id", propertyId)
    .eq("company_id", companyId)
    .single();

  if (propError || !property) return null;

  const [unitsRes, amenitiesRes] = await Promise.all([
    supabase
      .from("units")
      .select("id, unit_number, floor, size_sqft, bedrooms, bathrooms, type, status, rent_amount")
      .eq("property_id", propertyId)
      .order("floor", { ascending: true })
      .order("unit_number", { ascending: true }),
    supabase
      .from("amenities")
      .select("id, name, description")
      .eq("property_id", propertyId),
  ]);

  const units = unitsRes.data ?? [];
  const unitIds = units.map((u) => u.id);
  const { data: tenantsData } =
    unitIds.length > 0
      ? await supabase
          .from("tenants")
          .select("id, reference, full_name, email, phone, lease_start, lease_end, monthly_rent, status, unit_id")
          .eq("company_id", companyId)
          .in("unit_id", unitIds)
      : { data: [] };

  const tenants = (tenantsData ?? []).map((t) => {
    const unit = units.find((u) => u.id === t.unit_id);
    return { ...t, unit_number: unit?.unit_number ?? "-" };
  });
  const amenities = amenitiesRes.data ?? [];

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === "occupied").length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyPct = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return {
    property: {
      id: property.id,
      reference: property.reference,
      name: property.name,
      type: property.type,
      location: property.location,
      address: property.address,
      total_units: property.total_units,
      status: property.status,
      images: property.images ?? [],
    },
    stats: { totalUnits, occupiedUnits, vacantUnits, occupancyPct },
    units,
    tenants,
    amenities,
    companyId,
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPropertyDetail(id);
  if (!data) notFound();

  const { property, stats, units, tenants, amenities, companyId } = data;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{property.name}</h2>
          <Badge
            variant="secondary"
            className={
              property.status === "active"
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }
          >
            {property.status}
          </Badge>
          <Badge variant="outline">
            {property.type === "commercial" ? "Commercial" : "Residential"}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          {property.location}
          {property.address ? ` · ${property.address}` : ""}
        </p>
        <p className="text-muted-foreground text-sm font-mono mt-0.5">{property.reference}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.occupiedUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vacant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.vacantUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.occupancyPct}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>
        <TabsContent value="units">
          <PropertyDetailClient
            propertyId={property.id}
            companyId={companyId}
            tab="units"
            units={units}
          />
        </TabsContent>
        <TabsContent value="tenants">
          <PropertyDetailClient
            propertyId={property.id}
            companyId={companyId}
            tab="tenants"
            tenants={tenants}
          />
        </TabsContent>
        <TabsContent value="amenities">
          <PropertyDetailClient
            propertyId={property.id}
            companyId={companyId}
            tab="amenities"
            amenities={amenities}
          />
        </TabsContent>
        <TabsContent value="images">
          <PropertyDetailClient
            propertyId={property.id}
            companyId={companyId}
            tab="images"
            images={property.images}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
