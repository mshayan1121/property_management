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

const BOOKING_STATUSES = ["pending", "confirmed", "cancelled"] as const;

const bookingSchema = z.object({
  amenity_id: z.string().optional(),
  tenant_id: z.string().optional(),
  booking_date: z.string().min(1, "Booking date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  status: z.enum(BOOKING_STATUSES),
  notes: z.string().optional(),
});

export type AmenityBookingFormValues = z.infer<typeof bookingSchema>;

interface AmenityBookingFormProps {
  booking?: {
    id: string;
    reference: string;
    amenity_id: string | null;
    tenant_id: string | null;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: string;
    notes: string | null;
  };
  companyId: string;
  amenities: { id: string; name: string; property_id: string }[];
  tenants: { id: string; full_name: string; reference: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function AmenityBookingForm({
  booking,
  companyId,
  amenities,
  tenants,
  onSuccess,
  onCancel,
}: AmenityBookingFormProps) {
  const form = useForm<AmenityBookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      amenity_id: booking?.amenity_id ?? undefined,
      tenant_id: booking?.tenant_id ?? undefined,
      booking_date: booking?.booking_date ?? "",
      start_time: booking?.start_time ? booking.start_time.slice(0, 5) : "",
      end_time: booking?.end_time ? booking.end_time.slice(0, 5) : "",
      status: (booking?.status as AmenityBookingFormValues["status"]) ?? "pending",
      notes: booking?.notes ?? "",
    },
  });

  async function onSubmit(values: AmenityBookingFormValues) {
    const supabase = createClient();
    const payload = {
      amenity_id: values.amenity_id || null,
      tenant_id: values.tenant_id || null,
      booking_date: values.booking_date,
      start_time: values.start_time,
      end_time: values.end_time,
      status: values.status,
      notes: values.notes || null,
      company_id: companyId,
    };

    if (booking) {
      const { error } = await supabase
        .from("amenity_bookings")
        .update(payload)
        .eq("id", booking.id);

      if (error) {
        toast.error("Failed to update booking");
        return;
      }
      toast.success("Booking updated");
    } else {
      const { error } = await supabase
        .from("amenity_bookings")
        .insert(payload);

      if (error) {
        toast.error("Failed to create booking");
        return;
      }
      toast.success("Booking created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {booking && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Reference:</span>{" "}
            {booking.reference}
          </div>
        )}
        <FormField
          control={form.control}
          name="amenity_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amenity</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select amenity (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {amenities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
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
          name="booking_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Booking date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
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
                  {BOOKING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
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
                <Textarea placeholder="Notes (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 pt-4">
          <Button type="submit">
            {booking ? "Update booking" : "Create booking"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
