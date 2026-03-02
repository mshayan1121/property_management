"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

const VAT_RATE = 0.05;

const invoiceSchema = z.object({
  contract_id: z.string().optional(),
  tenant_id: z.string().optional(),
  contact_id: z.string().optional(),
  type: z.enum(["rent", "sale", "service", "other"]),
  amount: z.number().min(0),
  vat_amount: z.number().min(0),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  notes: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: {
    id: string;
    reference: string;
    contract_id: string | null;
    tenant_id: string | null;
    contact_id: string | null;
    type: string;
    amount: number;
    vat_amount: number;
    total_amount: number;
    due_date: string;
    status: string;
    notes: string | null;
  };
  companyId: string;
  contracts: { id: string; reference: string | null }[];
  tenants: { id: string; reference: string; full_name: string }[];
  contacts: { id: string; full_name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvoiceForm({
  invoice,
  companyId,
  contracts,
  tenants,
  contacts,
  onSuccess,
  onCancel,
}: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      contract_id: invoice?.contract_id ?? undefined,
      tenant_id: invoice?.tenant_id ?? undefined,
      contact_id: invoice?.contact_id ?? undefined,
      type: (invoice?.type ?? "rent") as InvoiceFormValues["type"],
      amount: Number(invoice?.amount ?? 0),
      vat_amount: Number(invoice?.vat_amount ?? 0),
      due_date: invoice?.due_date ?? "",
      status: (invoice?.status ?? "draft") as InvoiceFormValues["status"],
      notes: invoice?.notes ?? "",
    },
  });

  const amount = form.watch("amount");
  useEffect(() => {
    const vat = Math.round(amount * VAT_RATE * 100) / 100;
    form.setValue("vat_amount", vat, { shouldValidate: true });
  }, [amount, form]);

  const vatAmount = form.watch("vat_amount");
  const totalAmount = (amount || 0) + (vatAmount || 0);

  async function onSubmit(values: InvoiceFormValues) {
    const supabase = createClient();
    const total = Math.round((values.amount + values.vat_amount) * 100) / 100;
    const payload = {
      contract_id: values.contract_id || null,
      tenant_id: values.tenant_id || null,
      contact_id: values.contact_id || null,
      type: values.type,
      amount: values.amount,
      vat_amount: values.vat_amount,
      total_amount: total,
      due_date: values.due_date,
      status: values.status,
      notes: values.notes || null,
      company_id: companyId,
    };

    if (invoice) {
      const { error } = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", invoice.id);

      if (error) {
        toast.error("Failed to update invoice");
        return;
      }
      toast.success("Invoice updated");
    } else {
      const { error } = await supabase.from("invoices").insert(payload);

      if (error) {
        toast.error("Failed to create invoice");
        return;
      }
      toast.success("Invoice created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {invoice && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Reference:</span>{" "}
            {invoice.reference}
          </div>
        )}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contract_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.reference ?? c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tenant_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenant</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.reference} – {t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (AED)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? 0
                        : parseFloat(e.target.value) || 0
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vat_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VAT (AED)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? 0
                        : parseFloat(e.target.value) || 0
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <span className="text-muted-foreground">Total amount (AED):</span>{" "}
          {totalAmount.toFixed(2)}
        </div>
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {invoice ? "Update" : "Create"} Invoice
          </Button>
        </div>
      </form>
    </Form>
  );
}
