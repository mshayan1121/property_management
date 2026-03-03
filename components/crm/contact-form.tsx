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
  notesSchema,
} from "@/lib/validations";

const contactSchema = z.object({
  full_name: nameSchema,
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema.optional().or(z.literal("")),
  type: z.enum(["buyer", "seller", "tenant", "landlord"]).optional(),
  notes: notesSchema,
});

export type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    type: string | null;
    notes: string | null;
  };
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ContactForm({
  contact,
  companyId,
  onSuccess,
  onCancel,
}: ContactFormProps) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: contact?.full_name ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      type: (contact?.type ?? "buyer") as ContactFormValues["type"],
      notes: contact?.notes ?? "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    const supabase = createClient();
    const payload = {
      full_name: values.full_name,
      email: values.email || null,
      phone: values.phone || null,
      type: values.type || null,
      notes: values.notes || null,
      company_id: companyId,
    };

    if (contact) {
      const { error } = await supabase
        .from("contacts")
        .update(payload)
        .eq("id", contact.id);

      if (error) {
        toast.error("Failed to update contact");
        return;
      }
      await logAudit({
        action: "updated",
        resourceType: "contact",
        resourceId: contact.id,
        resourceReference: payload.full_name,
        newValues: payload,
        companyId,
      });
      toast.success("Contact updated");
    } else {
      const { error } = await supabase.from("contacts").insert(payload);

      if (error) {
        toast.error("Failed to create contact");
        return;
      }
      await logAudit({
        action: "created",
        resourceType: "contact",
        resourceReference: payload.full_name,
        newValues: payload,
        companyId,
      });
      toast.success("Contact created");
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
                <Input placeholder="John Doe" {...field} />
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
                <Input type="email" placeholder="john@example.com" {...field} />
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
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
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
            {contact ? "Update" : "Create"} Contact
          </Button>
        </div>
      </form>
    </Form>
  );
}
