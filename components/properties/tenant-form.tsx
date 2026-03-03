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
import { logAudit } from "@/lib/audit";
import {
  nameSchema,
  emailSchema,
  phoneSchema,
  dateSchema,
  notesSchema,
  amountSchema,
} from "@/lib/validations";

const tenantSchema = z.object({
  full_name: nameSchema,
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema.optional().or(z.literal("")),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  unit_id: z.string().min(1, "Unit is required").uuid("Invalid unit"),
  lease_start: dateSchema,
  lease_end: dateSchema,
  monthly_rent: amountSchema,
  payment_day: z.coerce.number().min(1).max(28),
  status: z.enum(["active", "expired", "terminated"]),
  notes: notesSchema,
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

interface TenantFormProps {
  tenant?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    contact_id: string | null;
    unit_id: string | null;
    lease_start: string;
    lease_end: string;
    monthly_rent: number;
    payment_day: number;
    status: string;
    notes: string | null;
  };
  units: { id: string; unit_number: string; property_name: string }[];
  contacts: { id: string; full_name: string }[];
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TenantForm({
  tenant,
  units,
  contacts,
  companyId,
  onSuccess,
  onCancel,
}: TenantFormProps) {
  const form = useForm<TenantFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tenantSchema) as any,
    defaultValues: {
      full_name: tenant?.full_name ?? "",
      email: tenant?.email ?? "",
      phone: tenant?.phone ?? "",
      contact_id: tenant?.contact_id ?? "",
      unit_id: tenant?.unit_id ?? "",
      lease_start: tenant?.lease_start ?? "",
      lease_end: tenant?.lease_end ?? "",
      monthly_rent: tenant?.monthly_rent ?? 0,
      payment_day: tenant?.payment_day ?? 1,
      status: (tenant?.status ?? "active") as "active" | "expired" | "terminated",
      notes: tenant?.notes ?? "",
    },
  });

  async function onSubmit(values: TenantFormValues) {
    const supabase = createClient();
    const payload = {
      full_name: values.full_name,
      email: values.email || null,
      phone: values.phone || null,
      contact_id: values.contact_id || null,
      unit_id: values.unit_id,
      lease_start: values.lease_start,
      lease_end: values.lease_end,
      monthly_rent: values.monthly_rent,
      payment_day: values.payment_day,
      status: values.status,
      notes: values.notes || null,
      company_id: companyId,
      updated_at: new Date().toISOString(),
    };

    if (tenant) {
      const { error } = await supabase.from("tenants").update(payload).eq("id", tenant.id);
      if (error) {
        toast.error("Failed to update tenant");
        return;
      }
      if (tenant.unit_id !== values.unit_id) {
        if (tenant.unit_id) {
          await supabase.from("units").update({ status: "vacant", updated_at: new Date().toISOString() }).eq("id", tenant.unit_id);
        }
        await supabase.from("units").update({ status: "occupied", updated_at: new Date().toISOString() }).eq("id", values.unit_id);
      } else if ((values.status === "terminated" || values.status === "expired") && values.unit_id) {
        await supabase.from("units").update({ status: "vacant", updated_at: new Date().toISOString() }).eq("id", values.unit_id);
      }
      await logAudit({
        action: "updated",
        resourceType: "tenant",
        resourceId: tenant.id,
        resourceReference: payload.full_name,
        newValues: payload,
        companyId,
      });
      toast.success("Tenant updated");
    } else {
      const { error } = await supabase.from("tenants").insert(payload);
      if (error) {
        toast.error("Failed to create tenant");
        return;
      }
      await supabase.from("units").update({ status: "occupied", updated_at: new Date().toISOString() }).eq("id", values.unit_id);
      await logAudit({
        action: "created",
        resourceType: "tenant",
        resourceReference: payload.full_name,
        newValues: payload,
        companyId,
      });
      toast.success("Tenant created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Tenant name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} />
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
                  <Input placeholder="+971 50 123 4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="contact_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact (CRM)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Link to contact (optional)" />
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
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unit_number} – {u.property_name}
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
            name="lease_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lease start</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lease_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lease end</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monthly_rent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly rent (AED)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.01} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment day (1–28)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={28} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
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
                <Textarea placeholder="Optional notes" rows={3} className="resize-none" {...field} />
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
            {tenant ? "Update" : "Create"} Tenant
          </Button>
        </div>
      </form>
    </Form>
  );
}
