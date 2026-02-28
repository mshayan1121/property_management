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
import { useState, useRef } from "react";

const contractSchema = z.object({
  deal_id: z.string().optional(),
  contact_id: z.string().optional(),
  type: z.enum(["sale", "rental"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  value: z.number().min(0),
  status: z.enum(["draft", "active", "expired", "terminated"]),
  notes: z.string().optional(),
});

export type ContractFormValues = z.infer<typeof contractSchema>;

interface ContractFormProps {
  contract?: {
    id: string;
    reference: string | null;
    deal_id: string | null;
    contact_id: string | null;
    type: string | null;
    start_date: string | null;
    end_date: string | null;
    value: number;
    status: string;
    document_url: string | null;
    notes: string | null;
  };
  companyId: string;
  deals: { id: string; reference: string | null }[];
  contacts: { id: string; full_name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ContractForm({
  contract,
  companyId,
  deals,
  contacts,
  onSuccess,
  onCancel,
}: ContractFormProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(
    contract?.document_url ?? null
  );

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      deal_id: contract?.deal_id ?? "",
      contact_id: contract?.contact_id ?? "",
      type: (contract?.type ?? "sale") as ContractFormValues["type"],
      start_date: contract?.start_date ?? "",
      end_date: contract?.end_date ?? "",
      value: Number(contract?.value ?? 0),
      status: (contract?.status ?? "draft") as ContractFormValues["status"],
      notes: contract?.notes ?? "",
    },
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const path = `contracts/${contract?.id ?? crypto.randomUUID()}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload file. Storage bucket may not be configured.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(path);
    setDocumentUrl(urlData.publicUrl);
    setUploading(false);
    toast.success("Document uploaded");
    e.target.value = "";
  }

  async function onSubmit(values: ContractFormValues) {
    const supabase = createClient();
    const payload = {
      deal_id: values.deal_id || null,
      contact_id: values.contact_id || null,
      type: values.type,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      value: values.value,
      status: values.status,
      document_url: documentUrl,
      notes: values.notes || null,
      company_id: companyId,
    };

    if (contract) {
      const { error } = await supabase
        .from("contracts")
        .update(payload)
        .eq("id", contract.id);

      if (error) {
        toast.error("Failed to update contract");
        return;
      }
      toast.success("Contract updated");
    } else {
      const { error } = await supabase.from("contracts").insert(payload);

      if (error) {
        toast.error("Failed to create contract");
        return;
      }
      toast.success("Contract created");
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {contract && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Reference:</span>{" "}
            {contract.reference ?? "Auto-generated"}
          </div>
        )}
        <FormField
          control={form.control}
          name="deal_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.reference ?? d.id}
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
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
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
                    <SelectValue />
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
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
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
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Document</FormLabel>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            {documentUrl && (
              <span className="text-muted-foreground text-sm">Document attached</span>
            )}
          </div>
        </FormItem>
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
            {contract ? "Update" : "Create"} Contract
          </Button>
        </div>
      </form>
    </Form>
  );
}
