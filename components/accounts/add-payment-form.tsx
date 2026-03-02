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

const addPaymentSchema = z.object({
  amount: z.number().min(0.01, "Amount is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  method: z.enum(["cash", "cheque", "bank_transfer", "pdc"]),
  notes: z.string().optional(),
});

export type AddPaymentFormValues = z.infer<typeof addPaymentSchema>;

interface AddPaymentFormProps {
  invoiceId: string;
  invoiceReference: string;
  totalAmount: number;
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onPaymentAdded: (amount: number) => void;
}

export function AddPaymentForm({
  invoiceId,
  totalAmount,
  companyId,
  onSuccess,
  onCancel,
  onPaymentAdded,
}: AddPaymentFormProps) {
  const form = useForm<AddPaymentFormValues>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: new Date().toISOString().slice(0, 10),
      method: "cash",
      notes: "",
    },
  });

  async function onSubmit(values: AddPaymentFormValues) {
    const supabase = createClient();
    const { data: inserted, error } = await supabase
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        amount: values.amount,
        payment_date: values.payment_date,
        method: values.method,
        notes: values.notes || null,
        company_id: companyId,
      })
      .select("id, reference, amount")
      .single();

    if (error) {
      toast.error("Failed to add payment");
      return;
    }

    const amount = Number(inserted?.amount ?? values.amount);
    onPaymentAdded(amount);

    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", invoiceId);
    const sum = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
    if (sum >= totalAmount) {
      await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoiceId);
    }

    toast.success("Payment added");
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="payment_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="pdc">PDC</SelectItem>
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
            Add payment
          </Button>
        </div>
      </form>
    </Form>
  );
}
