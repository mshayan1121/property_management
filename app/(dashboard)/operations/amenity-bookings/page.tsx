import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AmenityBookingsTable } from "@/components/operations/amenity-bookings-table";
import { ErrorBoundary } from "@/components/shared/error-boundary";

type AmenityBookingsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
  amenity?: string;
};

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

async function getAmenityBookingsData(searchParams: AmenityBookingsSearchParams) {
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

  let query = supabase
    .from("amenity_bookings")
    .select("id, reference, amenity_id, tenant_id, booking_date, start_time, end_time, status, notes", { count: "exact" })
    .eq("company_id", companyId)
    .order("booking_date", { ascending: false });

  if (search) {
    query = query.or(`reference.ilike.%${search}%`);
  }
  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  const amenityFilter = searchParams.amenity ?? "all";
  if (amenityFilter !== "all") query = query.eq("amenity_id", amenityFilter);

  const [bookingsRes, amenitiesRes, tenantsRes] = await Promise.all([
    query.range(from, to),
    supabase.from("amenities").select("id, name, property_id").eq("company_id", companyId),
    supabase.from("tenants").select("id, full_name, reference").eq("company_id", companyId),
  ]);

  const count = bookingsRes.count ?? 0;
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
    totalCount: count,
    page,
    pageSize,
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

export default async function AmenityBookingsPage({
  searchParams,
}: {
  searchParams: Promise<AmenityBookingsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Amenity Bookings</h2>
          <p className="text-muted-foreground">
            Manage amenity bookings for tenants
          </p>
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<AmenityBookingsTableSkeleton />}>
          <AmenityBookingsContent params={params} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

async function AmenityBookingsContent({ params }: { params: AmenityBookingsSearchParams }) {
  const { bookings, companyId, amenities, tenants, totalCount, page, pageSize } =
    await getAmenityBookingsData(params);

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
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{
        search: params.search ?? "",
        status: params.status ?? "all",
        amenity: params.amenity ?? "all",
      }}
    />
  );
}
