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

const MAINTENANCE_CATEGORIES = [
  "plumbing",
  "electrical",
  "hvac",
  "structural",
  "appliance",
  "cleaning",
  "other",
] as const;
const MAINTENANCE_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const maintenanceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  property_id: z.string().optional(),
  unit_id: z.string().optional(),
  tenant_id: z.string().optional(),
  category: z.enum(MAINTENANCE_CATEGORIES).optional(),
  priority: z.enum(PRIORITIES),
  status: z.enum(MAINTENANCE_STATUSES),
  assigned_to: z.string().optional(),
  estimated_cost: z.number().min(0),
  actual_cost: z.number().min(0),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  request?: {
    id: string;
    reference: string;
    title: string;
    description: string | null;
    property_id: string | null;
    unit_id: string | null;
    tenant_id: string | null;
    category: string | null;
    priority: string;
    status: string;
    assigned_to: string | null;
    estimated_cost: number;
    actual_cost: number;
  };
  companyId: string;
  properties: { id: string; reference: string; name: string }[];
  units: { id: string; unit_number: string; property_id: string }[];
  tenants: { id: string; full_name: string; reference: string }[];
  profiles: { id: string; full_name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function MaintenanceForm({
  request,
  companyId,
  properties,
  units,
  tenants,
  profiles,
  onSuccess,
  onCancel,
}: MaintenanceFormProps) {
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      title: request?.title ?? "",
      description: request?.description ?? "",
      property_id: request?.property_id ?? undefined,
      unit_id: request?.unit_id ?? undefined,
      tenant_id: request?.tenant_id ?? undefined,
      category: (request?.category as MaintenanceFormValues["category"]) ?? "plumbing",
      priority: (request?.priority as MaintenanceFormValues["priority"]) ?? "medium",
      status: (request?.status as MaintenanceFormValues["status"]) ?? "open",
      assigned_to: request?.assigned_to ?? undefined,
      estimated_cost: Number(request?.estimated_cost ?? 0),
      actual_cost: Number(request?.actual_cost ?? 0),
    },
  });

  const selectedPropertyId = form.watch("property_id");
  const unitsForProperty = selectedPropertyId
    ? units.filter((u) => u.property_id === selectedPropertyId)
    : [];

  async function onSubmit(values: MaintenanceFormValues) {
    const supabase = createClient();
    const payload = {
      title: values.title,
      description: values.description || null,
      property_id: values.property_id || null,
      unit_id: values.unit_id || null,
      tenant_id: values.tenant_id || null,
      category: values.category || null,
      priority: values.priority,
      status: values.status,
      assigned_to: values.assigned_to || null,
      estimated_cost: values.estimated_cost,
      actual_cost: values.actual_cost,
      company_id: companyId,
    };

    if (request) {
      const { error } = await supabase
        .from("maintenance_requests")
        .update(payload)
        .eq("id", request.id);

      if (error) {
        toast.error("Failed to update maintenance request");
        return;
      }
      toast.success("Maintenance request updated");
    } else {
      const { error } = await supabase
        .from("maintenance_requests")
        .insert(payload);

      if (error) {
        toast.error("Failed to create maintenance request");
        return;
      }
      toast.success("Maintenance request created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {request && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Reference:</span>{" "}
            {request.reference}
          </div>
        )}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Request title" {...field} />
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
          name="property_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v);
                  form.setValue("unit_id", undefined);
                }}
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
        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
                disabled={!selectedPropertyId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {unitsForProperty.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unit_number}
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
                  {MAINTENANCE_CATEGORIES.map((c) => (
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
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
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
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MAINTENANCE_STATUSES.map((s) => (
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
                    <SelectValue placeholder="Select assignee (optional)" />
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated cost (AED)</FormLabel>
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
            name="actual_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual cost (AED)</FormLabel>
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
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit">
            {request ? "Update request" : "Create request"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
