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
import { formatCurrency, formatDate } from "@/lib/utils";
import { WorkOrderForm } from "./work-order-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface WorkOrderRow {
  id: string;
  reference: string;
  title: string;
  maintenance_request_ref: string | null;
  vendor_name: string | null;
  assigned_name: string | null;
  status: string;
  scheduled_date: string | null;
  estimated_cost: number;
  description: string | null;
  maintenance_request_id: string | null;
  vendor_id: string | null;
  assigned_to: string | null;
  completed_date: string | null;
  actual_cost: number;
}

interface WorkOrdersTableProps {
  initialWorkOrders: WorkOrderRow[];
  companyId: string;
  maintenanceRequests: { id: string; reference: string; title: string }[];
  vendors: { id: string; name: string }[];
  profiles: { id: string; full_name: string }[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; status: string; vendor: string };
}

function buildWorkOrdersUrl(params: { page: number; pageSize: number; search: string; status: string; vendor: string }): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.status !== "all") sp.set("status", params.status);
  if (params.vendor !== "all") sp.set("vendor", params.vendor);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function WorkOrdersTable({
  initialWorkOrders,
  companyId,
  maintenanceRequests,
  vendors,
  profiles,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: WorkOrdersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filterParams.search);
  const [statusFilter, setStatusFilter] = useState<string>(filterParams.status);
  const [vendorFilter, setVendorFilter] = useState<string>(filterParams.vendor);
  const [addOpen, setAddOpen] = useState(false);
  const [editWO, setEditWO] = useState<WorkOrderRow | null>(null);
  const [deleteWO, setDeleteWO] = useState<WorkOrderRow | null>(null);

  const workOrders = initialWorkOrders.filter((w) => !deletedIds.has(w.id));

  const updateUrl = useCallback(
    (updates: { page?: number; pageSize?: number; search?: string; status?: string; vendor?: string }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      const searchNext = updates.search ?? search;
      const statusNext = updates.status ?? statusFilter;
      const vendorNext = updates.vendor ?? vendorFilter;
      router.push(pathname + buildWorkOrdersUrl({ page, pageSize: pageSizeNext, search: searchNext, status: statusNext, vendor: vendorNext }));
    },
    [router, pathname, currentPage, pageSize, search, statusFilter, vendorFilter]
  );

  const handleSearchSubmit = useCallback(() => updateUrl({ page: 1, search }), [updateUrl, search]);
  const handleStatusChange = useCallback((v: string) => { setStatusFilter(v); updateUrl({ page: 1, status: v }); }, [updateUrl]);
  const handleVendorChange = useCallback((v: string) => { setVendorFilter(v); updateUrl({ page: 1, vendor: v }); }, [updateUrl]);

  async function handleDelete(wo: WorkOrderRow) {
    const supabase = createClient();
    const { error } = await supabase.from("work_orders").delete().eq("id", wo.id);

    if (error) {
      toast.error("Failed to delete work order");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(wo.id));
    setDeleteWO(null);
    toast.success("Work order deleted");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by reference or title..."
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
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={vendorFilter} onValueChange={handleVendorChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Work Order
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {workOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No work orders yet."
                : "No work orders match your filters."}
            </p>
            {totalCount === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Work Order
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Maintenance request</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled date</TableHead>
                <TableHead className="text-right">Est. cost (AED)</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.reference}</TableCell>
                  <TableCell>{w.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {w.maintenance_request_ref ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {w.vendor_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {w.assigned_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[w.status] ?? "bg-muted"
                      }`}
                    >
                      {w.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {w.scheduled_date ? formatDate(w.scheduled_date) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(w.estimated_cost)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditWO(w)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteWO(w)}
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
            <SheetTitle>Add Work Order</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <WorkOrderForm
              companyId={companyId}
              maintenanceRequests={maintenanceRequests}
              vendors={vendors}
              profiles={profiles}
              onSuccess={() => {
                router.refresh();
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editWO} onOpenChange={(o) => !o && setEditWO(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editWO && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Work Order</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <WorkOrderForm
                  workOrder={{
                    id: editWO.id,
                    reference: editWO.reference,
                    title: editWO.title,
                    description: editWO.description,
                    maintenance_request_id: editWO.maintenance_request_id,
                    vendor_id: editWO.vendor_id,
                    assigned_to: editWO.assigned_to,
                    status: editWO.status,
                    scheduled_date: editWO.scheduled_date,
                    completed_date: editWO.completed_date,
                    estimated_cost: editWO.estimated_cost,
                    actual_cost: editWO.actual_cost,
                  }}
                  companyId={companyId}
                  maintenanceRequests={maintenanceRequests}
                  vendors={vendors}
                  profiles={profiles}
                  onSuccess={() => {
                    router.refresh();
                    setEditWO(null);
                  }}
                  onCancel={() => setEditWO(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteWO}
        onOpenChange={(o) => !o && setDeleteWO(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete work order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteWO?.reference}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteWO && handleDelete(deleteWO)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
