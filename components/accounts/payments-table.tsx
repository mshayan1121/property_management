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
import { Plus, Search, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentForm } from "./payment-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";

const METHOD_COLORS: Record<string, string> = {
  cash: "bg-muted",
  cheque: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  bank_transfer: "bg-green-500/10 text-green-600 dark:text-green-400",
  pdc: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

interface PaymentRow {
  id: string;
  reference: string;
  invoice_reference: string | null;
  amount: number;
  payment_date: string;
  method: string;
}

interface PaymentsTableProps {
  initialPayments: PaymentRow[];
  companyId: string;
  invoices: { id: string; reference: string }[];
}

export function PaymentsTable({
  initialPayments,
  companyId,
  invoices,
}: PaymentsTableProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deletePayment, setDeletePayment] = useState<PaymentRow | null>(null);

  const payments = initialPayments.filter((p) => !deletedIds.has(p.id));

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      !search ||
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      (p.invoice_reference?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchMethod = methodFilter === "all" || p.method === methodFilter;
    return matchSearch && matchMethod;
  });

  async function handleDelete(p: PaymentRow) {
    const supabase = createClient();
    const { error } = await supabase.from("payments").delete().eq("id", p.id);

    if (error) {
      toast.error("Failed to delete payment");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(p.id));
    setDeletePayment(null);
    toast.success("Payment deleted");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="bank_transfer">Bank transfer</SelectItem>
              <SelectItem value="pdc">PDC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add payment
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {payments.length === 0
                ? "No payments yet. Add your first payment."
                : "No payments match your filters."}
            </p>
            {payments.length === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add payment
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.reference}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.invoice_reference ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(p.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(p.payment_date)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                        METHOD_COLORS[p.method] ?? "bg-muted"
                      }`}
                    >
                      {p.method.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <PermissionGate permission="canDelete">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletePayment(p)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </PermissionGate>
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
            <SheetTitle>Add payment</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <PaymentForm
              companyId={companyId}
              invoices={invoices}
              onSuccess={() => {
                router.refresh();
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deletePayment}
        onOpenChange={(o) => !o && setDeletePayment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletePayment?.reference}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deletePayment && handleDelete(deletePayment)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
