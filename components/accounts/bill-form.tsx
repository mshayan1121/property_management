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
const BILL_CATEGORIES = [
  "maintenance",
  "utilities",
  "insurance",
  "cleaning",
  "security",
  "management",
  "other",
] as const;

const billSchema = z.object({
  property_id: z.string().optional(),
  vendor_id: z.string().optional(),
  category: z.enum(BILL_CATEGORIES),
  description: z.string().optional(),
  amount: z.number().min(0),
  vat_amount: z.number().min(0),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]),
  notes: z.string().optional(),
});

export type BillFormValues = z.infer<typeof billSchema>;

interface BillFormProps {
  bill?: {
    id: string;
    reference: string;
    property_id: string | null;
    vendor_id: string | null;
    category: string;
    description: string | null;
    amount: number;
    vat_amount: number;
    total_amount: number;
    due_date: string;
    status: string;
    notes: string | null;
  };
  companyId: string;
  properties: { id: string; reference: string; name: string }[];
  vendors: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function BillForm({
  bill,
  companyId,
  properties,
  vendors,
  onSuccess,
  onCancel,
}: BillFormProps) {
  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      property_id: bill?.property_id ?? undefined,
      vendor_id: bill?.vendor_id ?? undefined,
      category: (bill?.category ?? "maintenance") as BillFormValues["category"],
      description: bill?.description ?? "",
      amount: Number(bill?.amount ?? 0),
      vat_amount: Number(bill?.vat_amount ?? 0),
      due_date: bill?.due_date ?? "",
      status: (bill?.status ?? "pending") as BillFormValues["status"],
      notes: bill?.notes ?? "",
    },
  });

  const amount = form.watch("amount");
  useEffect(() => {
    const vat = Math.round(amount * VAT_RATE * 100) / 100;
    form.setValue("vat_amount", vat, { shouldValidate: true });
  }, [amount, form]);

  const vatAmount = form.watch("vat_amount");
  const totalAmount = (amount || 0) + (vatAmount || 0);

  async function onSubmit(values: BillFormValues) {
    const supabase = createClient();
    const total = Math.round((values.amount + values.vat_amount) * 100) / 100;
    const payload = {
      property_id: values.property_id || null,
      vendor_id: values.vendor_id || null,
      category: values.category,
      description: values.description || null,
      amount: values.amount,
      vat_amount: values.vat_amount,
      total_amount: total,
      due_date: values.due_date,
      status: values.status,
      notes: values.notes || null,
      company_id: companyId,
    };

    if (bill) {
      const { error } = await supabase
        .from("bills")
        .update(payload)
        .eq("id", bill.id);

      if (error) {
        toast.error("Failed to update bill");
        return;
      }
      toast.success("Bill updated");
    } else {
      const { error } = await supabase.from("bills").insert(payload);

      if (error) {
        toast.error("Failed to create bill");
        return;
      }
      toast.success("Bill created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {bill && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Reference:</span>{" "}
            {bill.reference}
          </div>
        )}
        <FormField
          control={form.control}
          name="property_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.reference} – {prop.name}
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
          name="vendor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BILL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Description" {...field} />
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
          <span className="text-muted-foreground">Total (AED):</span>{" "}
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
                  <SelectItem value="pending">Pending</SelectItem>
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
            {bill ? "Update" : "Create"} Bill
          </Button>
        </div>
      </form>
    </Form>
  );
}
