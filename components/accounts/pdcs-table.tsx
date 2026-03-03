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
import { PdcForm } from "./pdc-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";
import { differenceInDays, parseISO } from "date-fns";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  deposited: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  cleared: "bg-green-500/10 text-green-600 dark:text-green-400",
  bounced: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

interface PdcRow {
  id: string;
  reference: string;
  cheque_number: string;
  bank_name: string;
  tenant_name: string | null;
  amount: number;
  cheque_date: string;
  status: string;
  invoice_id: string | null;
  tenant_id: string | null;
  notes: string | null;
}

interface PdcsTableProps {
  initialPdcs: PdcRow[];
  companyId: string;
  invoices: { id: string; reference: string }[];
  tenants: { id: string; reference: string; full_name: string }[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; status: string };
}

function buildPdcsUrl(params: { page: number; pageSize: number; search: string; status: string }): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.status !== "all") sp.set("status", params.status);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function PdcsTable({
  initialPdcs,
  companyId,
  invoices,
  tenants,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: PdcsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filterParams.search);
  const [statusFilter, setStatusFilter] = useState<string>(filterParams.status);
  const [addOpen, setAddOpen] = useState(false);
  const [editPdc, setEditPdc] = useState<PdcRow | null>(null);
  const [deletePdc, setDeletePdc] = useState<PdcRow | null>(null);

  const pdcs = initialPdcs.filter((p) => !deletedIds.has(p.id));

  const updateUrl = useCallback(
    (updates: { page?: number; pageSize?: number; search?: string; status?: string }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      const searchNext = updates.search ?? search;
      const statusNext = updates.status ?? statusFilter;
      router.push(pathname + buildPdcsUrl({ page, pageSize: pageSizeNext, search: searchNext, status: statusNext }));
    },
    [router, pathname, currentPage, pageSize, search, statusFilter]
  );

  const handleSearchSubmit = useCallback(() => updateUrl({ page: 1, search }), [updateUrl, search]);
  const handleStatusChange = useCallback((value: string) => { setStatusFilter(value); updateUrl({ page: 1, status: value }); }, [updateUrl]);

  function isDueWithin7Days(chequeDate: string): boolean {
    const d = parseISO(chequeDate);
    const days = differenceInDays(d, new Date());
    return days >= 0 && days <= 7;
  }

  async function handleDelete(p: PdcRow) {
    const supabase = createClient();
    const { error } = await supabase.from("pdcs").delete().eq("id", p.id);

    if (error) {
      toast.error("Failed to delete PDC");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(p.id));
    setDeletePdc(null);
    toast.success("PDC deleted");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cheque number, bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              onBlur={handleSearchSubmit}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="deposited">Deposited</SelectItem>
              <SelectItem value="cleared">Cleared</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add PDC
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {pdcs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No PDCs yet. Add your first post-dated cheque."
                : "No PDCs match your filters."}
            </p>
            {totalCount === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add PDC
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Cheque number</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Cheque date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pdcs.map((p) => {
                const dueSoon = p.status === "pending" && isDueWithin7Days(p.cheque_date);
                return (
                  <TableRow
                    key={p.id}
                    className={dueSoon ? "bg-orange-500/5" : undefined}
                  >
                    <TableCell className="font-medium">{p.reference}</TableCell>
                    <TableCell>{p.cheque_number}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.bank_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.tenant_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(p.cheque_date)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[p.status] ?? "bg-muted"
                        }`}
                      >
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <PermissionGate permission="canEdit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setEditPdc(p)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="canDelete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletePdc(p)}
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
            <SheetTitle>Add PDC</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <PdcForm
              companyId={companyId}
              invoices={invoices}
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

      <Sheet open={!!editPdc} onOpenChange={(o) => !o && setEditPdc(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editPdc && (
            <>
              <SheetHeader>
                <SheetTitle>Edit PDC</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <PdcForm
                  pdc={{
                    id: editPdc.id,
                    reference: editPdc.reference,
                    invoice_id: editPdc.invoice_id,
                    tenant_id: editPdc.tenant_id,
                    cheque_number: editPdc.cheque_number,
                    bank_name: editPdc.bank_name,
                    amount: editPdc.amount,
                    cheque_date: editPdc.cheque_date,
                    status: editPdc.status,
                    notes: editPdc.notes,
                  }}
                  companyId={companyId}
                  invoices={invoices}
                  tenants={tenants}
                  onSuccess={() => {
                    router.refresh();
                    setEditPdc(null);
                  }}
                  onCancel={() => setEditPdc(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deletePdc}
        onOpenChange={(o) => !o && setDeletePdc(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PDC</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletePdc?.reference}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deletePdc && handleDelete(deletePdc)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
