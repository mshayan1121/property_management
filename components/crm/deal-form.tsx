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

const dealSchema = z.object({
  lead_id: z.string().optional(),
  contact_id: z.string().optional(),
  type: z.enum(["sale", "rental"]),
  stage: z.enum([
    "qualified",
    "viewed",
    "negotiation",
    "contract_draft",
    "contract_signed",
  ]),
  value: z.number().min(0),
  commission_rate: z.number().min(0).max(100),
  payment_type: z.enum(["cash", "mortgage", "bank_transfer", "cheque"]).optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
});

export type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  deal?: {
    id: string;
    reference: string | null;
    lead_id: string | null;
    contact_id: string | null;
    type: string | null;
    stage: string | null;
    value: number;
    commission_rate: number;
    commission_amount: number;
    payment_type: string | null;
    assigned_to: string | null;
    notes: string | null;
  };
  companyId: string;
  leads: { id: string; full_name: string }[];
  contacts: { id: string; full_name: string }[];
  profiles: { id: string; full_name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function DealForm({
  deal,
  companyId,
  leads,
  contacts,
  profiles,
  onSuccess,
  onCancel,
}: DealFormProps) {
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      lead_id: deal?.lead_id ?? "",
      contact_id: deal?.contact_id ?? "",
      type: (deal?.type ?? "sale") as DealFormValues["type"],
      stage: (deal?.stage ?? "qualified") as DealFormValues["stage"],
      value: deal?.value ?? 0,
      commission_rate: deal?.commission_rate ?? 0,
      payment_type: (deal?.payment_type ?? "cash") as DealFormValues["payment_type"],
      assigned_to: deal?.assigned_to ?? "",
      notes: deal?.notes ?? "",
    },
  });

  async function onSubmit(values: DealFormValues) {
    const commissionAmount = (values.value * values.commission_rate) / 100;

    const supabase = createClient();
    const payload = {
      lead_id: values.lead_id || null,
      contact_id: values.contact_id || null,
      type: values.type,
      stage: values.stage,
      value: values.value,
      commission_rate: values.commission_rate,
      commission_amount: commissionAmount,
      payment_type: values.payment_type || null,
      assigned_to: values.assigned_to || null,
      notes: values.notes || null,
      company_id: companyId,
    };

    if (deal) {
      const { error } = await supabase
        .from("deals")
        .update(payload)
        .eq("id", deal.id);

      if (error) {
        toast.error("Failed to update deal");
        return;
      }
      toast.success("Deal updated");
    } else {
      const { error } = await supabase.from("deals").insert(payload);

      if (error) {
        toast.error("Failed to create deal");
        return;
      }
      toast.success("Deal created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {deal && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Reference:</span>{" "}
            {deal.reference ?? "Auto-generated"}
          </div>
        )}
        <FormField
          control={form.control}
          name="lead_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.full_name}
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
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="contract_draft">Contract Draft</SelectItem>
                  <SelectItem value="contract_signed">Contract Signed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value (AED)</FormLabel>
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
          name="commission_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commission rate (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
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
              <p className="text-muted-foreground text-xs">
                Commission: AED{" "}
                {((form.watch("value") ?? 0) * (form.watch("commission_rate") ?? 0) / 100).toLocaleString("en-AE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="payment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned to</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
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
            {deal ? "Update" : "Create"} Deal
          </Button>
        </div>
      </form>
    </Form>
  );
}
