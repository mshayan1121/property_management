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
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Pencil, Trash2, Layers } from "lucide-react";
import { UnitForm } from "./unit-form";
import { BulkCreateUnitsForm } from "./bulk-create-units-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PermissionGate } from "@/components/shared/permission-gate";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

const STATUS_COLORS: Record<string, string> = {
  vacant: "bg-green-500/10 text-green-600 dark:text-green-400",
  occupied: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export interface UnitRow {
  id: string;
  property_id: string;
  property_name: string;
  unit_number: string;
  floor: number | null;
  size_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  type: string | null;
  status: string;
  rent_amount: number;
}

interface UnitsTableProps {
  initialUnits: UnitRow[];
  properties: { id: string; name: string }[];
  companyId: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

function buildUnitsUrl(params: { page: number; pageSize: number }): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function UnitsTable({
  initialUnits,
  properties,
  companyId,
  totalCount,
  currentPage,
  pageSize,
}: UnitsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const units = initialUnits.filter((u) => !deletedIds.has(u.id));
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<UnitRow | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<UnitRow | null>(null);

  const refresh = useCallback(() => {
    router.refresh();
    setAddOpen(false);
    setBulkOpen(false);
    setEditUnit(null);
    setDeleteUnit(null);
  }, [router]);

  const updateUrl = useCallback(
    (updates: { page?: number; pageSize?: number }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      router.push(pathname + buildUnitsUrl({ page, pageSize: pageSizeNext }));
    },
    [router, pathname, currentPage, pageSize]
  );

  const filtered = units.filter((u) => {
    const matchSearch =
      !search || u.unit_number.toLowerCase().includes(search.toLowerCase());
    const matchProperty = propertyFilter === "all" || u.property_id === propertyFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    const matchType = typeFilter === "all" || u.type === typeFilter;
    return matchSearch && matchProperty && matchStatus && matchType;
  });

  async function handleDelete(u: UnitRow) {
    const supabase = createClient();
    const { error } = await supabase.from("units").delete().eq("id", u.id);
    if (error) {
      toast.error("Failed to delete unit");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(u.id));
    setDeleteUnit(null);
    toast.success("Unit deleted");
    refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm min-w-[160px]">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by unit number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <PermissionGate permission="canCreate">
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Layers className="mr-2 size-4" />
              Bulk create
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Unit
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="rounded-md border">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No units yet. Add or bulk create units to get started."
                : "No units match your filters."}
            </p>
            {totalCount === 0 && (
              <div className="mt-4 flex gap-2">
                <PermissionGate permission="canCreate">
                  <Button variant="outline" onClick={() => setBulkOpen(true)}>
                    Bulk create
                  </Button>
                  <Button onClick={() => setAddOpen(true)}>Add Unit</Button>
                </PermissionGate>
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Size (sqft)</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Baths</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rent (AED)</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.unit_number}</TableCell>
                  <TableCell className="text-muted-foreground">{u.property_name}</TableCell>
                  <TableCell>{u.floor ?? "-"}</TableCell>
                  <TableCell>{u.size_sqft != null ? u.size_sqft : "-"}</TableCell>
                  <TableCell>{u.bedrooms ?? "-"}</TableCell>
                  <TableCell>{u.bathrooms ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {(u.type ?? "-").charAt(0).toUpperCase() + (u.type ?? "-").slice(1)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_COLORS[u.status] ?? "bg-muted"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(u.rent_amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditUnit(u)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteUnit(u)}
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
        <SheetContent className="overflow-y-auto sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Add Unit</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <UnitForm
              properties={properties}
              companyId={companyId}
              onSuccess={refresh}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={bulkOpen} onOpenChange={setBulkOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Bulk Create Units</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <BulkCreateUnitsForm
              properties={properties}
              companyId={companyId}
              onSuccess={refresh}
              onCancel={() => setBulkOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editUnit} onOpenChange={(o) => !o && setEditUnit(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[500px]">
          {editUnit && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Unit</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <UnitForm
                  unit={{
                    id: editUnit.id,
                    property_id: editUnit.property_id,
                    unit_number: editUnit.unit_number,
                    floor: editUnit.floor,
                    size_sqft: editUnit.size_sqft,
                    bedrooms: editUnit.bedrooms,
                    bathrooms: editUnit.bathrooms,
                    type: editUnit.type,
                    status: editUnit.status,
                    rent_amount: editUnit.rent_amount,
                  }}
                  properties={properties}
                  companyId={companyId}
                  onSuccess={refresh}
                  onCancel={() => setEditUnit(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteUnit} onOpenChange={(o) => !o && setDeleteUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete unit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete unit {deleteUnit?.unit_number}. Any tenant linked to
              this unit will need to be updated. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUnit && handleDelete(deleteUnit)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
