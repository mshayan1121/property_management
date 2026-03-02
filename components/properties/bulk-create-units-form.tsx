"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const bulkSchema = z.object({
  property_id: z.string().min(1, "Property is required"),
  count: z.coerce.number().min(1, "At least 1 unit"),
  start_number: z.coerce.number().min(0, "Invalid start"),
  floor: z.coerce.number().min(0).optional().nullable(),
  type: z.enum(["residential", "commercial"]),
  rent_amount: z.coerce.number().min(0),
});

export type BulkCreateUnitsValues = z.infer<typeof bulkSchema>;

interface BulkCreateUnitsFormProps {
  properties: { id: string; name: string }[];
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BulkCreateUnitsForm({
  properties,
  companyId,
  onSuccess,
  onCancel,
}: BulkCreateUnitsFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BulkCreateUnitsValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bulkSchema) as any,
    defaultValues: {
      property_id: "",
      count: 5,
      start_number: 101,
      floor: 1,
      type: "residential",
      rent_amount: 0,
    },
  });

  async function onSubmit(values: BulkCreateUnitsValues) {
    setSubmitting(true);
    const supabase = createClient();
    const inserts = [];
    for (let i = 0; i < values.count; i++) {
      const unitNumber = String(values.start_number + i);
      inserts.push({
        property_id: values.property_id,
        unit_number: unitNumber,
        floor: values.floor ?? null,
        type: values.type,
        status: "vacant",
        rent_amount: values.rent_amount,
        company_id: companyId,
      });
    }
    const { error } = await supabase.from("units").insert(inserts);
    setSubmitting(false);
    if (error) {
      toast.error("Failed to create units: " + error.message);
      return;
    }
    toast.success(`Created ${values.count} units`);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="property_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
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
          name="count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of units</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="start_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starting unit number</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                e.g. 101 → creates 101, 102, 103...
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="floor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Floor</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
              </FormControl>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rent_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rent amount (AED)</FormLabel>
              <FormControl>
                <Input type="number" min={0} step={0.01} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create units"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
