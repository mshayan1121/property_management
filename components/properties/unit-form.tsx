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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const unitSchema = z.object({
  property_id: z.string().min(1, "Property is required"),
  unit_number: z.string().min(1, "Unit number is required"),
  floor: z.coerce.number().min(0).optional().nullable(),
  size_sqft: z.coerce.number().min(0).optional().nullable(),
  bedrooms: z.coerce.number().min(0).optional().nullable(),
  bathrooms: z.coerce.number().min(0).optional().nullable(),
  type: z.enum(["residential", "commercial"]).optional(),
  status: z.enum(["vacant", "occupied"]),
  rent_amount: z.coerce.number().min(0),
});

export type UnitFormValues = z.infer<typeof unitSchema>;

interface UnitFormProps {
  unit?: {
    id: string;
    property_id: string;
    unit_number: string;
    floor: number | null;
    size_sqft: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    type: string | null;
    status: string;
    rent_amount: number;
  };
  properties: { id: string; name: string }[];
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UnitForm({
  unit,
  properties,
  companyId,
  onSuccess,
  onCancel,
}: UnitFormProps) {
  const form = useForm<UnitFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(unitSchema) as any,
    defaultValues: {
      property_id: unit?.property_id ?? "",
      unit_number: unit?.unit_number ?? "",
      floor: unit?.floor ?? undefined,
      size_sqft: unit?.size_sqft ?? undefined,
      bedrooms: unit?.bedrooms ?? undefined,
      bathrooms: unit?.bathrooms ?? undefined,
      type: (unit?.type ?? "residential") as "residential" | "commercial",
      status: (unit?.status ?? "vacant") as "vacant" | "occupied",
      rent_amount: unit?.rent_amount ?? 0,
    },
  });

  async function onSubmit(values: UnitFormValues) {
    const supabase = createClient();
    const payload = {
      property_id: values.property_id,
      unit_number: values.unit_number,
      floor: values.floor ?? null,
      size_sqft: values.size_sqft ?? null,
      bedrooms: values.bedrooms ?? null,
      bathrooms: values.bathrooms ?? null,
      type: values.type ?? null,
      status: values.status,
      rent_amount: values.rent_amount,
      company_id: companyId,
      updated_at: new Date().toISOString(),
    };

    if (unit) {
      const { error } = await supabase.from("units").update(payload).eq("id", unit.id);
      if (error) {
        toast.error("Failed to update unit");
        return;
      }
      toast.success("Unit updated");
    } else {
      const { error } = await supabase.from("units").insert(payload);
      if (error) {
        toast.error("Failed to create unit");
        return;
      }
      toast.success("Unit created");
    }
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
          name="unit_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 101" {...field} />
              </FormControl>
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="size_sqft"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size (sqft)</FormLabel>
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
            name="rent_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rent (AED)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.01} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedrooms</FormLabel>
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
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bathrooms</FormLabel>
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
        </div>
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? "residential"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {unit ? "Update" : "Create"} Unit
          </Button>
        </div>
      </form>
    </Form>
  );
}
