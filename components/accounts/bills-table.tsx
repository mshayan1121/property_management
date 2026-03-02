"use client";

import { useState } from "react";
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
import { BillForm } from "./bill-form";
import { BillPdfButton } from "@/components/pdf/bill-pdf-button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

interface BillRow {
  id: string;
  reference: string;
  property_name: string | null;
  vendor_name: string | null;
  category: string;
  description: string | null;
  amount: number;
  vat_amount: number;
  total_amount: number;
  due_date: string;
  status: string;
  property_id: string | null;
  vendor_id: string | null;
  notes: string | null;
}

interface BillsTableProps {
  initialBills: BillRow[];
  companyId: string;
  companyName: string;
  properties: { id: string; reference: string; name: string }[];
  vendors: { id: string; name: string }[];
}

export function BillsTable({
  initialBills,
  companyId,
  companyName,
  properties,
  vendors,
}: BillsTableProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editBill, setEditBill] = useState<BillRow | null>(null);
  const [deleteBill, setDeleteBill] = useState<BillRow | null>(null);

  const bills = initialBills.filter((b) => !deletedIds.has(b.id));

  const filteredBills = bills.filter((b) => {
    const matchSearch =
      !search ||
      b.reference.toLowerCase().includes(search.toLowerCase()) ||
      (b.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchCategory =
      categoryFilter === "all" || b.category === categoryFilter;
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const matchProperty =
      propertyFilter === "all" || b.property_id === propertyFilter;
    return matchSearch && matchCategory && matchStatus && matchProperty;
  });

  async function handleDelete(b: BillRow) {
    const supabase = createClient();
    const { error } = await supabase.from("bills").delete().eq("id", b.id);

    if (error) {
      toast.error("Failed to delete bill");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(b.id));
    setDeleteBill(null);
    toast.success("Bill deleted");
    router.refresh();
  }

  async function handleMarkAsPaid(b: BillRow) {
    const supabase = createClient();
    const { error } = await supabase
      .from("bills")
      .update({ status: "paid" })
      .eq("id", b.id);

    if (error) {
      toast.error("Failed to update bill");
      return;
    }
    toast.success("Bill marked as paid");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.reference}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Bill
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {bills.length === 0
                ? "No bills yet. Add your first bill."
                : "No bills match your filters."}
            </p>
            {bills.length === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Bill
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.reference}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.property_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.vendor_name ?? "—"}
                  </TableCell>
                  <TableCell className="capitalize">{b.category}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(b.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(b.vat_amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(b.total_amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(b.due_date)}
                  </TableCell>
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
                      <BillPdfButton
                        data={{
                          reference: b.reference,
                          due_date: b.due_date,
                          status: b.status,
                          category: b.category,
                          description: b.description,
                          amount: b.amount,
                          vat_amount: b.vat_amount,
                          total_amount: b.total_amount,
                          vendor: {
                            name: b.vendor_name ?? "—",
                            email: null,
                            phone: null,
                          },
                          notes: b.notes,
                        }}
                        companyName={companyName}
                      />
                      {b.status !== "paid" && b.status !== "cancelled" && (
                        <PermissionGate permission="canEdit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleMarkAsPaid(b)}
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
                          onClick={() => setEditBill(b)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteBill(b)}
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
            <SheetTitle>Add Bill</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <BillForm
              companyId={companyId}
              properties={properties}
              vendors={vendors}
              onSuccess={() => {
                router.refresh();
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editBill} onOpenChange={(o) => !o && setEditBill(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editBill && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Bill</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <BillForm
                  bill={{
                    id: editBill.id,
                    reference: editBill.reference,
                    property_id: editBill.property_id,
                    vendor_id: editBill.vendor_id,
                    category: editBill.category,
                    description: editBill.description,
                    amount: editBill.amount,
                    vat_amount: editBill.vat_amount,
                    total_amount: editBill.total_amount,
                    due_date: editBill.due_date,
                    status: editBill.status,
                    notes: editBill.notes,
                  }}
                  companyId={companyId}
                  properties={properties}
                  vendors={vendors}
                  onSuccess={() => {
                    router.refresh();
                    setEditBill(null);
                  }}
                  onCancel={() => setEditBill(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteBill}
        onOpenChange={(o) => !o && setDeleteBill(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteBill?.reference}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteBill && handleDelete(deleteBill)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
