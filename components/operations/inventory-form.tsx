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

const INVENTORY_CATEGORIES = [
  "furniture",
  "appliance",
  "equipment",
  "supplies",
  "other",
] as const;
const UNITS = ["pieces", "sets", "kg", "liters", "other"] as const;
const STATUSES = ["available", "low_stock", "out_of_stock"] as const;

const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.enum(INVENTORY_CATEGORIES).optional(),
  property_id: z.string().optional(),
  quantity: z.number().int().min(0),
  unit: z.enum(UNITS),
  minimum_quantity: z.number().int().min(0),
  status: z.enum(STATUSES),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  item?: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    property_id: string | null;
    quantity: number;
    unit: string;
    minimum_quantity: number;
    status: string;
  };
  companyId: string;
  properties: { id: string; reference: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function InventoryForm({
  item,
  companyId,
  properties,
  onSuccess,
  onCancel,
}: InventoryFormProps) {
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      category: (item?.category as InventoryFormValues["category"]) ?? "supplies",
      property_id: item?.property_id ?? undefined,
      quantity: item?.quantity ?? 0,
      unit: (item?.unit as InventoryFormValues["unit"]) ?? "pieces",
      minimum_quantity: item?.minimum_quantity ?? 0,
      status: (item?.status as InventoryFormValues["status"]) ?? "available",
    },
  });

  async function onSubmit(values: InventoryFormValues) {
    const supabase = createClient();
    const payload = {
      name: values.name,
      description: values.description || null,
      category: values.category || null,
      property_id: values.property_id || null,
      quantity: values.quantity,
      unit: values.unit,
      minimum_quantity: values.minimum_quantity,
      status: values.status,
      company_id: companyId,
    };

    if (item) {
      const { error } = await supabase
        .from("inventory_items")
        .update(payload)
        .eq("id", item.id);

      if (error) {
        toast.error("Failed to update item");
        return;
      }
      toast.success("Item updated");
    } else {
      const { error } = await supabase
        .from("inventory_items")
        .insert(payload);

      if (error) {
        toast.error("Failed to create item");
        return;
      }
      toast.success("Item created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Item name" {...field} />
              </FormControl>
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
                <Textarea placeholder="Description (optional)" {...field} />
              </FormControl>
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
                  {INVENTORY_CATEGORIES.map((c) => (
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
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.reference} – {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? 0
                          : parseInt(e.target.value, 10) || 0
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
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="minimum_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? 0
                        : parseInt(e.target.value, 10) || 0
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 pt-4">
          <Button type="submit">
            {item ? "Update item" : "Create item"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
