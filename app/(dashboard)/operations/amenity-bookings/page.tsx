import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AmenityBookingsTable } from "@/components/operations/amenity-bookings-table";

type BookingRow = {
  id: string;
  reference: string;
  amenity_id: string | null;
  amenity_name: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
};

async function getAmenityBookingsData() {
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
      bookings: [] as BookingRow[],
      amenities: [] as { id: string; name: string; property_id: string }[],
      tenants: [] as { id: string; full_name: string; reference: string }[],
      companyId: "",
    };
  }

  const [bookingsRes, amenitiesRes, tenantsRes] = await Promise.all([
    supabase
      .from("amenity_bookings")
      .select("id, reference, amenity_id, tenant_id, booking_date, start_time, end_time, status, notes")
      .eq("company_id", companyId)
      .order("booking_date", { ascending: false }),
    supabase
      .from("amenities")
      .select("id, name, property_id")
      .eq("company_id", companyId),
    supabase
      .from("tenants")
      .select("id, full_name, reference")
      .eq("company_id", companyId),
  ]);

  const amenitiesMap = new Map(
    (amenitiesRes.data ?? []).map((a) => [a.id, a.name])
  );
  const tenantsMap = new Map(
    (tenantsRes.data ?? []).map((t) => [t.id, t.full_name])
  );

  const bookings: BookingRow[] = (bookingsRes.data ?? []).map((b) => ({
    ...b,
    amenity_name: b.amenity_id ? amenitiesMap.get(b.amenity_id) ?? null : null,
    tenant_name: b.tenant_id ? tenantsMap.get(b.tenant_id) ?? null : null,
  }));

  return {
    bookings,
    amenities: amenitiesRes.data ?? [],
    tenants: (tenantsRes.data ?? []).map((t) => ({
      id: t.id,
      full_name: t.full_name,
      reference: t.reference,
    })),
    companyId,
  };
}

function AmenityBookingsTableSkeleton() {
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

export default async function AmenityBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Amenity Bookings</h2>
        <p className="text-muted-foreground">
          Manage amenity bookings for tenants
        </p>
      </div>

      <Suspense fallback={<AmenityBookingsTableSkeleton />}>
        <AmenityBookingsContent />
      </Suspense>
    </div>
  );
}

async function AmenityBookingsContent() {
  const { bookings, companyId, amenities, tenants } =
    await getAmenityBookingsData();

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage amenity bookings.
        </p>
      </div>
    );
  }

  if (amenities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          No amenities set up yet. Go to Properties → Listings → open a
          property → Amenities tab to add amenities first.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/properties/listings">Go to Properties</Link>
        </Button>
      </div>
    );
  }

  return (
    <AmenityBookingsTable
      initialBookings={bookings}
      companyId={companyId}
      amenities={amenities}
      tenants={tenants}
    />
  );
}
