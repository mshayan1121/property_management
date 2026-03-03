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
import { VendorForm } from "./vendor-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

interface VendorRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string | null;
  address: string | null;
  trn: string | null;
  status: string;
  notes: string | null;
}

interface VendorsTableProps {
  initialVendors: VendorRow[];
  companyId: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; category: string; status: string };
}

function buildVendorsUrl(params: { page: number; pageSize: number; search: string; category: string; status: string }): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.category !== "all") sp.set("category", params.category);
  if (params.status !== "all") sp.set("status", params.status);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function VendorsTable({
  initialVendors,
  companyId,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: VendorsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filterParams.search);
  const [categoryFilter, setCategoryFilter] = useState<string>(filterParams.category);
  const [statusFilter, setStatusFilter] = useState<string>(filterParams.status);
  const [addOpen, setAddOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorRow | null>(null);
  const [deleteVendor, setDeleteVendor] = useState<VendorRow | null>(null);

  const vendors = initialVendors.filter((v) => !deletedIds.has(v.id));

  const updateUrl = useCallback(
    (updates: { page?: number; pageSize?: number; search?: string; category?: string; status?: string }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      const searchNext = updates.search ?? search;
      const categoryNext = updates.category ?? categoryFilter;
      const statusNext = updates.status ?? statusFilter;
      router.push(pathname + buildVendorsUrl({ page, pageSize: pageSizeNext, search: searchNext, category: categoryNext, status: statusNext }));
    },
    [router, pathname, currentPage, pageSize, search, categoryFilter, statusFilter]
  );

  const handleSearchSubmit = useCallback(() => updateUrl({ page: 1, search }), [updateUrl, search]);
  const handleCategoryChange = useCallback((value: string) => { setCategoryFilter(value); updateUrl({ page: 1, category: value }); }, [updateUrl]);
  const handleStatusChange = useCallback((value: string) => { setStatusFilter(value); updateUrl({ page: 1, status: value }); }, [updateUrl]);

  async function handleDelete(v: VendorRow) {
    const supabase = createClient();
    const { error } = await supabase.from("vendors").delete().eq("id", v.id);

    if (error) {
      toast.error("Failed to delete vendor");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(v.id));
    setDeleteVendor(null);
    toast.success("Vendor deleted");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              onBlur={handleSearchSubmit}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="management">Management</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Vendor
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No vendors yet. Add your first vendor."
                : "No vendors match your filters."}
            </p>
            {totalCount === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Vendor
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>TRN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.phone ?? "—"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {v.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.trn ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        v.status === "active"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {v.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditVendor(v)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteVendor(v)}
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
            <SheetTitle>Add Vendor</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <VendorForm
              companyId={companyId}
              onSuccess={() => {
                router.refresh();
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editVendor}
        onOpenChange={(o) => !o && setEditVendor(null)}
      >
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editVendor && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Vendor</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <VendorForm
                  vendor={{
                    id: editVendor.id,
                    name: editVendor.name,
                    email: editVendor.email,
                    phone: editVendor.phone,
                    category: editVendor.category,
                    address: editVendor.address,
                    trn: editVendor.trn,
                    status: editVendor.status,
                    notes: editVendor.notes,
                  }}
                  companyId={companyId}
                  onSuccess={() => {
                    router.refresh();
                    setEditVendor(null);
                  }}
                  onCancel={() => setEditVendor(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteVendor}
        onOpenChange={(o) => !o && setDeleteVendor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteVendor?.name}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteVendor && handleDelete(deleteVendor)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
