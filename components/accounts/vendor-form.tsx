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

const VENDOR_CATEGORIES = [
  "maintenance",
  "utilities",
  "insurance",
  "cleaning",
  "security",
  "management",
  "other",
] as const;

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  category: z.enum(VENDOR_CATEGORIES).optional(),
  address: z.string().optional(),
  trn: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  notes: z.string().optional(),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;

interface VendorFormProps {
  vendor?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    category: string | null;
    address: string | null;
    trn: string | null;
    status: string;
    notes: string | null;
  };
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VendorForm({
  vendor,
  companyId,
  onSuccess,
  onCancel,
}: VendorFormProps) {
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: vendor?.name ?? "",
      email: vendor?.email ?? "",
      phone: vendor?.phone ?? "",
      category: (vendor?.category ?? "maintenance") as VendorFormValues["category"],
      address: vendor?.address ?? "",
      trn: vendor?.trn ?? "",
      status: (vendor?.status ?? "active") as VendorFormValues["status"],
      notes: vendor?.notes ?? "",
    },
  });

  async function onSubmit(values: VendorFormValues) {
    const supabase = createClient();
    const payload = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      category: values.category || null,
      address: values.address || null,
      trn: values.trn || null,
      status: values.status,
      notes: values.notes || null,
      company_id: companyId,
    };

    if (vendor) {
      const { error } = await supabase
        .from("vendors")
        .update(payload)
        .eq("id", vendor.id);

      if (error) {
        toast.error("Failed to update vendor");
        return;
      }
      toast.success("Vendor updated");
    } else {
      const { error } = await supabase.from("vendors").insert(payload);

      if (error) {
        toast.error("Failed to create vendor");
        return;
      }
      toast.success("Vendor created");
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
                <Input placeholder="Vendor name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Phone" {...field} />
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
                  {VENDOR_CATEGORIES.map((c) => (
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="trn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>TRN (Tax Registration Number)</FormLabel>
              <FormControl>
                <Input placeholder="UAE TRN" {...field} />
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
            {vendor ? "Update" : "Create"} Vendor
          </Button>
        </div>
      </form>
    </Form>
  );
}
