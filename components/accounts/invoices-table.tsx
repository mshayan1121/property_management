"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Plus, Search, Pencil, Trash2, Banknote } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceForm } from "./invoice-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";
import { logAudit } from "@/lib/audit";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

interface InvoiceRow {
  id: string;
  reference: string;
  type: string;
  contract_id: string | null;
  tenant_id: string | null;
  contact_id: string | null;
  tenant_name: string | null;
  contact_name: string | null;
  amount: number;
  vat_amount: number;
  total_amount: number;
  due_date: string;
  status: string;
  notes: string | null;
}

interface InvoicesTableProps {
  initialInvoices: InvoiceRow[];
  companyId: string;
  contracts: { id: string; reference: string | null }[];
  tenants: { id: string; reference: string; full_name: string }[];
  contacts: { id: string; full_name: string }[];
}

export function InvoicesTable({
  initialInvoices,
  companyId,
  contracts,
  tenants,
  contacts,
}: InvoicesTableProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<InvoiceRow | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<InvoiceRow | null>(null);

  const invoices = initialInvoices.filter((i) => !deletedIds.has(i.id));

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.reference.toLowerCase().includes(search.toLowerCase()) ||
      (inv.tenant_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (inv.contact_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchType = typeFilter === "all" || inv.type === typeFilter;
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  async function handleDelete(inv: InvoiceRow) {
    const supabase = createClient();
    const { error } = await supabase.from("invoices").delete().eq("id", inv.id);

    if (error) {
      toast.error("Failed to delete invoice");
      return;
    }
    await logAudit({
      action: "deleted",
      resourceType: "invoice",
      resourceId: inv.id,
      resourceReference: inv.reference,
      oldValues: { reference: inv.reference },
      companyId,
    });
    setDeletedIds((prev) => new Set(prev).add(inv.id));
    setDeleteInvoice(null);
    toast.success("Invoice deleted");
    router.refresh();
  }

  async function handleMarkAsPaid(inv: InvoiceRow) {
    const supabase = createClient();
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", inv.id);

    if (error) {
      toast.error("Failed to update invoice");
      return;
    }
    toast.success("Invoice marked as paid");
    router.refresh();
  }

  const tenantOrContact = (inv: InvoiceRow) =>
    inv.tenant_name ?? inv.contact_name ?? "—";

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Invoice
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {invoices.length === 0
                ? "No invoices yet. Add your first invoice to get started."
                : "No invoices match your filters."}
            </p>
            {invoices.length === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Invoice
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tenant / Contact</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/accounts/invoices/${inv.id}`}
                      className="hover:underline"
                    >
                      {inv.reference}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{inv.type}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {tenantOrContact(inv)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(inv.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(inv.vat_amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(inv.total_amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(inv.due_date)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[inv.status] ?? "bg-muted"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {inv.status !== "paid" && inv.status !== "cancelled" && (
                        <PermissionGate permission="canEdit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleMarkAsPaid(inv)}
                            title="Mark as paid"
                          >
                            <Banknote className="size-4" />
                          </Button>
                        </PermissionGate>
                      )}
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditInvoice(inv)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteInvoice(inv)}
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

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Add Invoice</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <InvoiceForm
              companyId={companyId}
              contracts={contracts}
              tenants={tenants}
              contacts={contacts}
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
        open={!!editInvoice}
        onOpenChange={(o) => !o && setEditInvoice(null)}
      >
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editInvoice && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Invoice</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <InvoiceForm
                  invoice={{
                    id: editInvoice.id,
                    reference: editInvoice.reference,
                    contract_id: editInvoice.contract_id,
                    tenant_id: editInvoice.tenant_id,
                    contact_id: editInvoice.contact_id,
                    type: editInvoice.type,
                    amount: editInvoice.amount,
                    vat_amount: editInvoice.vat_amount,
                    total_amount: editInvoice.total_amount,
                    due_date: editInvoice.due_date,
                    status: editInvoice.status,
                    notes: editInvoice.notes,
                  }}
                  companyId={companyId}
                  contracts={contracts}
                  tenants={tenants}
                  contacts={contacts}
                  onSuccess={() => {
                    router.refresh();
                    setEditInvoice(null);
                  }}
                  onCancel={() => setEditInvoice(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteInvoice}
        onOpenChange={(o) => !o && setDeleteInvoice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteInvoice?.reference}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteInvoice && handleDelete(deleteInvoice)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
