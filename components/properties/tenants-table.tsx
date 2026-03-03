"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { TenantForm } from "./tenant-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";
import { PermissionGate } from "@/components/shared/permission-gate";
import { logAudit } from "@/lib/audit";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  expired: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  terminated: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export interface TenantRow {
  id: string;
  reference: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  contact_id: string | null;
  unit_id: string | null;
  unit_number: string;
  property_name: string;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  payment_day?: number;
  status: string;
  notes: string | null;
  daysUntilExpiry: number;
}

interface TenantsTableProps {
  initialTenants: TenantRow[];
  units: { id: string; unit_number: string; property_name: string; status?: string }[];
  contacts: { id: string; full_name: string }[];
  properties: { id: string; name: string }[];
  companyId: string;
}

export function TenantsTable({
  initialTenants,
  units,
  contacts,
  properties,
  companyId,
}: TenantsTableProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const tenants = initialTenants.filter((t) => !deletedIds.has(t.id));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<TenantRow | null>(null);
  const [detailTenant, setDetailTenant] = useState<TenantRow | null>(null);
  const [deleteTenant, setDeleteTenant] = useState<TenantRow | null>(null);

  // Compute daysUntilExpiry only on client to avoid hydration mismatch (server "today" vs client "today").
  // Depend on initialTenants (stable prop), not tenants (new array ref every render), to avoid infinite loop.
  const [expiryDaysMap, setExpiryDaysMap] = useState<Record<string, number>>({});
  useEffect(() => {
    const next: Record<string, number> = {};
    initialTenants.forEach((t) => {
      next[t.id] = differenceInDays(parseISO(t.lease_end), new Date());
    });
    setExpiryDaysMap(next);
  }, [initialTenants]);

  const refresh = useCallback(() => {
    router.refresh();
    setAddOpen(false);
    setEditTenant(null);
    setDetailTenant(null);
    setDeleteTenant(null);
  }, [router]);

  const filtered = tenants.filter((t) => {
    const matchSearch =
      !search ||
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (t.phone?.includes(search) ?? false);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchProperty = propertyFilter === "all" || (propertyFilter && t.property_name === properties.find((p) => p.id === propertyFilter)?.name);
    return matchSearch && matchStatus && matchProperty;
  });

  async function handleDelete(t: TenantRow) {
    const supabase = createClient();
    const { error } = await supabase.from("tenants").delete().eq("id", t.id);
    if (error) {
      toast.error("Failed to delete tenant");
      return;
    }
    if (t.unit_id) {
      await supabase.from("units").update({ status: "vacant", updated_at: new Date().toISOString() }).eq("id", t.unit_id);
    }
    await logAudit({
      action: "deleted",
      resourceType: "tenant",
      resourceId: t.id,
      resourceReference: t.reference ?? t.full_name,
      oldValues: { full_name: t.full_name },
      companyId,
    });
    setDeletedIds((prev) => new Set(prev).add(t.id));
    setDeleteTenant(null);
    toast.success("Tenant deleted");
    router.refresh();
  }

  const vacantUnits = units.filter((u) => u.status === "vacant");
  const unitsForEdit = units;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm min-w-[160px]">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
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
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Tenant
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {tenants.length === 0
                ? "No tenants yet. Add your first tenant to get started."
                : "No tenants match your filters."}
            </p>
            {tenants.length === 0 && (
              <PermissionGate permission="canCreate">
                <Button variant="outline" className="mt-4" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Add Tenant
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Lease end</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const daysUntilExpiry = expiryDaysMap[t.id] ?? t.daysUntilExpiry;
                const expiryWarning = daysUntilExpiry <= 30 && daysUntilExpiry >= 0 && t.status === "active";
                return (
                  <TableRow
                    key={t.id}
                    className={`cursor-pointer ${expiryWarning ? "bg-orange-500/5" : ""}`}
                    onClick={() => setDetailTenant(t)}
                  >
                    <TableCell className="font-mono text-muted-foreground">{t.reference}</TableCell>
                    <TableCell className="font-medium">{t.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.email ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{t.phone ?? "-"}</TableCell>
                    <TableCell>{t.unit_number}</TableCell>
                    <TableCell className="text-muted-foreground">{t.property_name}</TableCell>
                    <TableCell>
                      <span className={expiryWarning ? "text-orange-600 dark:text-orange-400 font-medium" : ""}>
                        {formatDate(t.lease_end)}
                      </span>
                      {expiryWarning && (
                        <Badge variant="secondary" className="ml-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs">
                          {daysUntilExpiry}d
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(t.monthly_rent)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[t.status] ?? "bg-muted"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <PermissionGate permission="canEdit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditTenant(t);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="canDelete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTenant(t);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Add Tenant</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <TenantForm
              units={vacantUnits}
              contacts={contacts}
              companyId={companyId}
              onSuccess={refresh}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editTenant} onOpenChange={(o) => !o && setEditTenant(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editTenant && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Tenant</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <TenantForm
                  tenant={{
                    id: editTenant.id,
                    full_name: editTenant.full_name,
                    email: editTenant.email,
                    phone: editTenant.phone,
                    contact_id: editTenant.contact_id,
                    unit_id: editTenant.unit_id,
                    lease_start: editTenant.lease_start,
                    lease_end: editTenant.lease_end,
                    monthly_rent: editTenant.monthly_rent,
                    payment_day: editTenant.payment_day ?? 1,
                    status: editTenant.status,
                    notes: editTenant.notes,
                  }}
                  units={unitsForEdit}
                  contacts={contacts}
                  companyId={companyId}
                  onSuccess={refresh}
                  onCancel={() => setEditTenant(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!detailTenant} onOpenChange={(o) => !o && setDetailTenant(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[500px]">
          {detailTenant && (
            <>
              <SheetHeader>
                <SheetTitle>{detailTenant.full_name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 p-6 pt-0">
                <div>
                  <p className="text-muted-foreground text-sm">Reference</p>
                  <p className="font-mono">{detailTenant.reference}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <p>{detailTenant.email ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Phone</p>
                  <p>{detailTenant.phone ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Unit / Property</p>
                  <p>{detailTenant.unit_number} – {detailTenant.property_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Lease</p>
                  <p>{formatDate(detailTenant.lease_start)} – {formatDate(detailTenant.lease_end)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Monthly rent</p>
                  <p>{formatCurrency(detailTenant.monthly_rent)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Days until lease expiry</p>
                  <p>
                    {(expiryDaysMap[detailTenant.id] ?? detailTenant.daysUntilExpiry) > 0
                      ? (expiryDaysMap[detailTenant.id] ?? detailTenant.daysUntilExpiry)
                      : (expiryDaysMap[detailTenant.id] ?? detailTenant.daysUntilExpiry) === 0
                        ? "Expires today"
                        : "Expired"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Status</p>
                  <Badge variant="secondary" className={STATUS_COLORS[detailTenant.status] ?? "bg-muted"}>
                    {detailTenant.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm pt-2">Payment history (Phase 4)</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTenant} onOpenChange={(o) => !o && setDeleteTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTenant?.full_name}. The unit will be marked as
              vacant. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTenant && handleDelete(deleteTenant)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
