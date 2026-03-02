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

const WO_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;

const workOrderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  maintenance_request_id: z.string().optional(),
  vendor_id: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.enum(WO_STATUSES),
  scheduled_date: z.string().optional(),
  completed_date: z.string().optional(),
  estimated_cost: z.number().min(0),
  actual_cost: z.number().min(0),
});

export type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  workOrder?: {
    id: string;
    reference: string;
    title: string;
    description: string | null;
    maintenance_request_id: string | null;
    vendor_id: string | null;
    assigned_to: string | null;
    status: string;
    scheduled_date: string | null;
    completed_date: string | null;
    estimated_cost: number;
    actual_cost: number;
  };
  companyId: string;
  maintenanceRequests: { id: string; reference: string; title: string }[];
  vendors: { id: string; name: string }[];
  profiles: { id: string; full_name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function WorkOrderForm({
  workOrder,
  companyId,
  maintenanceRequests,
  vendors,
  profiles,
  onSuccess,
  onCancel,
}: WorkOrderFormProps) {
  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: workOrder?.title ?? "",
      description: workOrder?.description ?? "",
      maintenance_request_id: workOrder?.maintenance_request_id ?? undefined,
      vendor_id: workOrder?.vendor_id ?? undefined,
      assigned_to: workOrder?.assigned_to ?? undefined,
      status: (workOrder?.status as WorkOrderFormValues["status"]) ?? "pending",
      scheduled_date: workOrder?.scheduled_date ?? "",
      completed_date: workOrder?.completed_date ?? "",
      estimated_cost: Number(workOrder?.estimated_cost ?? 0),
      actual_cost: Number(workOrder?.actual_cost ?? 0),
    },
  });

  async function onSubmit(values: WorkOrderFormValues) {
    const supabase = createClient();
    const payload = {
      title: values.title,
      description: values.description || null,
      maintenance_request_id: values.maintenance_request_id || null,
      vendor_id: values.vendor_id || null,
      assigned_to: values.assigned_to || null,
      status: values.status,
      scheduled_date: values.scheduled_date || null,
      completed_date: values.completed_date || null,
      estimated_cost: values.estimated_cost,
      actual_cost: values.actual_cost,
      company_id: companyId,
    };

    if (workOrder) {
      const { error } = await supabase
        .from("work_orders")
        .update(payload)
        .eq("id", workOrder.id);

      if (error) {
        toast.error("Failed to update work order");
        return;
      }
      toast.success("Work order updated");
    } else {
      const { error } = await supabase.from("work_orders").insert(payload);

      if (error) {
        toast.error("Failed to create work order");
        return;
      }
      toast.success("Work order created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {workOrder && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Reference:</span>{" "}
            {workOrder.reference}
          </div>
        )}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Work order title" {...field} />
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
          name="maintenance_request_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance request</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select request (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {maintenanceRequests.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.reference} – {m.title}
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
                  {WO_STATUSES.map((s) => (
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduled_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="completed_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Completed date</FormLabel>
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
            {workOrder ? "Update work order" : "Create work order"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
