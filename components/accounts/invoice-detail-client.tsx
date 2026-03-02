"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Banknote, FileCheck } from "lucide-react";
import { AddPaymentForm } from "./add-payment-form";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  cheque: "Cheque",
  bank_transfer: "Bank transfer",
  pdc: "PDC",
};

const PDC_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  deposited: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  cleared: "bg-green-500/10 text-green-600 dark:text-green-400",
  bounced: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

interface PaymentRow {
  id: string;
  reference: string;
  amount: number;
  payment_date: string;
  method: string;
  notes: string | null;
  created_at: string;
}

interface PdcRow {
  id: string;
  reference: string;
  cheque_number: string;
  bank_name: string;
  amount: number;
  cheque_date: string;
  status: string;
}

interface InvoiceDetailClientProps {
  invoiceId: string;
  invoiceReference: string;
  totalAmount: number;
  status: string;
  companyId: string;
  initialPayments: PaymentRow[];
  initialPdcs: PdcRow[];
}

export function InvoiceDetailClient({
  invoiceId,
  invoiceReference,
  totalAmount,
  status,
  companyId,
  initialPayments,
  initialPdcs,
}: InvoiceDetailClientProps) {
  const router = useRouter();
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  const totalPaid = initialPayments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalAmount - totalPaid);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment history</CardTitle>
            <CardDescription>Payments received for this invoice</CardDescription>
          </div>
          {status !== "paid" && status !== "cancelled" && (
            <Button onClick={() => setAddPaymentOpen(true)} size="sm">
              <Banknote className="mr-2 size-4" />
              Add payment
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Total paid:</span>
            <span className="font-medium">{formatCurrency(totalPaid)}</span>
            <span className="text-muted-foreground">Remaining:</span>
            <span className="font-medium">{formatCurrency(remaining)}</span>
          </div>
          {initialPayments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.reference}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(p.payment_date)}
                    </TableCell>
                    <TableCell>
                      {METHOD_LABELS[p.method] ?? p.method}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(p.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {initialPdcs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked PDCs</CardTitle>
            <CardDescription>Post-dated cheques for this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Cheque / Bank</TableHead>
                  <TableHead>Cheque date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialPdcs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.reference}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.cheque_number} / {p.bank_name}
                    </TableCell>
                    <TableCell>{formatDate(p.cheque_date)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          PDC_STATUS_COLORS[p.status] ?? "bg-muted"
                        }`}
                      >
                        {p.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Sheet open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Add payment</SheetTitle>
            <SheetDescription>Invoice {invoiceReference}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <AddPaymentForm
              invoiceId={invoiceId}
              invoiceReference={invoiceReference}
              totalAmount={totalAmount}
              companyId={companyId}
              onSuccess={() => {
                setAddPaymentOpen(false);
                router.refresh();
              }}
              onCancel={() => setAddPaymentOpen(false)}
              onPaymentAdded={() => router.refresh()}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
