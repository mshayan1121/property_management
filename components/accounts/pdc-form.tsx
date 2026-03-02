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

const pdcSchema = z.object({
  invoice_id: z.string().optional(),
  tenant_id: z.string().optional(),
  cheque_number: z.string().min(1, "Cheque number is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  amount: z.number().min(0),
  cheque_date: z.string().min(1, "Cheque date is required"),
  status: z.enum(["pending", "deposited", "cleared", "bounced", "cancelled"]),
  notes: z.string().optional(),
});

export type PdcFormValues = z.infer<typeof pdcSchema>;

interface PdcFormProps {
  pdc?: {
    id: string;
    reference: string;
    invoice_id: string | null;
    tenant_id: string | null;
    cheque_number: string;
    bank_name: string;
    amount: number;
    cheque_date: string;
    status: string;
    notes: string | null;
  };
  companyId: string;
  invoices: { id: string; reference: string }[];
  tenants: { id: string; reference: string; full_name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function PdcForm({
  pdc,
  companyId,
  invoices,
  tenants,
  onSuccess,
  onCancel,
}: PdcFormProps) {
  const form = useForm<PdcFormValues>({
    resolver: zodResolver(pdcSchema),
    defaultValues: {
      invoice_id: pdc?.invoice_id ?? undefined,
      tenant_id: pdc?.tenant_id ?? undefined,
      cheque_number: pdc?.cheque_number ?? "",
      bank_name: pdc?.bank_name ?? "",
      amount: Number(pdc?.amount ?? 0),
      cheque_date: pdc?.cheque_date ?? "",
      status: (pdc?.status ?? "pending") as PdcFormValues["status"],
      notes: pdc?.notes ?? "",
    },
  });

  async function onSubmit(values: PdcFormValues) {
    const supabase = createClient();
    const payload = {
      invoice_id: values.invoice_id || null,
      tenant_id: values.tenant_id || null,
      cheque_number: values.cheque_number,
      bank_name: values.bank_name,
      amount: values.amount,
      cheque_date: values.cheque_date,
      status: values.status,
      notes: values.notes || null,
      company_id: companyId,
    };

    if (pdc) {
      const { error } = await supabase
        .from("pdcs")
        .update(payload)
        .eq("id", pdc.id);

      if (error) {
        toast.error("Failed to update PDC");
        return;
      }
      toast.success("PDC updated");
    } else {
      const { error } = await supabase.from("pdcs").insert(payload);

      if (error) {
        toast.error("Failed to create PDC");
        return;
      }
      toast.success("PDC created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {pdc && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Reference:</span>{" "}
            {pdc.reference}
          </div>
        )}
        <FormField
          control={form.control}
          name="invoice_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {invoices.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.reference}
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
          name="cheque_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cheque number</FormLabel>
              <FormControl>
                <Input placeholder="Cheque number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank name</FormLabel>
              <FormControl>
                <Input placeholder="Bank name" {...field} />
              </FormControl>
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
          name="cheque_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cheque date</FormLabel>
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deposited">Deposited</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
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
                  placeholder="Optional notes..."
                  className="resize-none"
                  rows={2}
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
            {pdc ? "Update" : "Create"} PDC
          </Button>
        </div>
      </form>
    </Form>
  );
}
