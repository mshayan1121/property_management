"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { AmenityBookingForm } from "./amenity-booking-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  confirmed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface BookingRow {
  id: string;
  reference: string;
  amenity_name: string | null;
  tenant_name: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  amenity_id: string | null;
  tenant_id: string | null;
}

interface AmenityBookingsTableProps {
  initialBookings: BookingRow[];
  companyId: string;
  amenities: { id: string; name: string; property_id: string }[];
  tenants: { id: string; full_name: string; reference: string }[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; status: string; amenity: string };
}

function buildAmenityBookingsUrl(params: { page: number; pageSize: number; search: string; status: string; amenity: string }): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.status !== "all") sp.set("status", params.status);
  if (params.amenity !== "all") sp.set("amenity", params.amenity);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function AmenityBookingsTable({
  initialBookings,
  companyId,
  amenities,
  tenants,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: AmenityBookingsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filterParams.search);
  const [statusFilter, setStatusFilter] = useState<string>(filterParams.status);
  const [amenityFilter, setAmenityFilter] = useState<string>(filterParams.amenity);
  const [addOpen, setAddOpen] = useState(false);
  const [editBooking, setEditBooking] = useState<BookingRow | null>(null);
  const [deleteBooking, setDeleteBooking] = useState<BookingRow | null>(null);

  const bookings = initialBookings.filter((b) => !deletedIds.has(b.id));

  const updateUrl = useCallback(
    (updates: { page?: number; pageSize?: number; search?: string; status?: string; amenity?: string }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      const searchNext = updates.search ?? search;
      const statusNext = updates.status ?? statusFilter;
      const amenityNext = updates.amenity ?? amenityFilter;
      router.push(pathname + buildAmenityBookingsUrl({ page, pageSize: pageSizeNext, search: searchNext, status: statusNext, amenity: amenityNext }));
    },
    [router, pathname, currentPage, pageSize, search, statusFilter, amenityFilter]
  );

  const handleSearchSubmit = useCallback(() => updateUrl({ page: 1, search }), [updateUrl, search]);
  const handleStatusChange = useCallback((v: string) => { setStatusFilter(v); updateUrl({ page: 1, status: v }); }, [updateUrl]);
  const handleAmenityChange = useCallback((v: string) => { setAmenityFilter(v); updateUrl({ page: 1, amenity: v }); }, [updateUrl]);

  async function handleDelete(booking: BookingRow) {
    const supabase = createClient();
    const { error } = await supabase
      .from("amenity_bookings")
      .delete()
      .eq("id", booking.id);

    if (error) {
      toast.error("Failed to delete booking");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(booking.id));
    setDeleteBooking(null);
    toast.success("Booking deleted");
    router.refresh();
  }

  return (
    <>
      <div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        suppressHydrationWarning
      >
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by reference or tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              onBlur={handleSearchSubmit}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-1">
            <Select value={amenityFilter} onValueChange={handleAmenityChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Amenity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All amenities</SelectItem>
                {amenities.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {amenities.length === 0 && (
              <p className="text-muted-foreground text-xs">
                No amenities found. Add amenities from Properties → Listings →
                Select a property → Amenities tab
              </p>
            )}
          </div>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Booking
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No amenity bookings yet."
                : "No bookings match your filters."}
            </p>
            {totalCount === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Booking
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Amenity</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Booking date</TableHead>
                <TableHead>Start time</TableHead>
                <TableHead>End time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.reference}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.amenity_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.tenant_name ?? "—"}
                  </TableCell>
                  <TableCell>{formatDate(b.booking_date)}</TableCell>
                  <TableCell>{formatTime(b.start_time)}</TableCell>
                  <TableCell>{formatTime(b.end_time)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[b.status] ?? "bg-muted"
                      }`}
                    >
                      {b.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditBooking(b)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteBooking(b)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalCount > 0 && (
        <DataTablePagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(page) => updateUrl({ page })}
          onPageSizeChange={(size) => updateUrl({ page: 1, pageSize: size })}
        />
      )}

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Add amenity booking</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <AmenityBookingForm
              companyId={companyId}
              amenities={amenities}
              tenants={tenants}
              onSuccess={() => {
                router.refresh();
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editBooking} onOpenChange={(o) => !o && setEditBooking(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editBooking && (
            <>
              <SheetHeader>
                <SheetTitle>Edit amenity booking</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <AmenityBookingForm
                  booking={{
                    id: editBooking.id,
                    reference: editBooking.reference,
                    amenity_id: editBooking.amenity_id,
                    tenant_id: editBooking.tenant_id,
                    booking_date: editBooking.booking_date,
                    start_time: editBooking.start_time,
                    end_time: editBooking.end_time,
                    status: editBooking.status,
                    notes: editBooking.notes,
                  }}
                  companyId={companyId}
                  amenities={amenities}
                  tenants={tenants}
                  onSuccess={() => {
                    router.refresh();
                    setEditBooking(null);
                  }}
                  onCancel={() => setEditBooking(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteBooking}
        onOpenChange={(o) => !o && setDeleteBooking(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteBooking?.reference}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteBooking && handleDelete(deleteBooking)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
