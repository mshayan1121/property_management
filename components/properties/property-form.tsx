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
import { X } from "lucide-react";
import Image from "next/image";

const propertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["residential", "commercial"]),
  location: z.string().min(1, "Location is required"),
  address: z.string().optional(),
  total_units: z.coerce.number().min(0, "Must be 0 or more"),
  status: z.enum(["active", "inactive"]),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  property?: {
    id: string;
    name: string;
    type: string | null;
    location: string;
    address: string | null;
    total_units: number;
    status: string;
    images: string[] | null;
  };
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PropertyForm({
  property,
  companyId,
  onSuccess,
  onCancel,
}: PropertyFormProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(property?.images ?? []);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PropertyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertySchema) as any,
    defaultValues: {
      name: property?.name ?? "",
      type: (property?.type ?? "residential") as "residential" | "commercial",
      location: property?.location ?? "",
      address: property?.address ?? "",
      total_units: property?.total_units ?? 0,
      status: (property?.status ?? "active") as "active" | "inactive",
    },
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const supabase = createClient();
    const propertyId = property?.id;
    if (!propertyId) {
      toast.error("Save the property first, then add images.");
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${propertyId}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage
          .from("property-images")
          .upload(path, file, { upsert: true });
        if (error) {
          toast.error(`Upload failed: ${error.message}`);
          continue;
        }
        const { data: urlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
      setImageUrls((prev) => [...prev, ...uploaded]);
      if (uploaded.length) toast.success("Images uploaded");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  async function onSubmit(values: PropertyFormValues) {
    const supabase = createClient();
    const payload = {
      name: values.name,
      type: values.type,
      location: values.location,
      address: values.address || null,
      total_units: values.total_units,
      status: values.status,
      images: imageUrls,
      company_id: companyId,
      updated_at: new Date().toISOString(),
    };

    if (property) {
      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", property.id);

      if (error) {
        toast.error("Failed to update property");
        return;
      }
      toast.success("Property updated");
    } else {
      const { error } = await supabase.from("properties").insert({
        ...payload,
        images: imageUrls.length ? imageUrls : [],
      });

      if (error) {
        toast.error("Failed to create property");
        return;
      }
      toast.success("Property created");
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
                <Input placeholder="Building name" {...field} />
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
                    <SelectValue placeholder="Select type" />
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
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Dubai Marina" {...field} />
              </FormControl>
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
                <Input placeholder="Full address (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="total_units"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total units</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
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
              <Select onValueChange={field.onChange} value={field.value}>
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
        <div>
          <FormLabel>Images</FormLabel>
          {property?.id && (
            <div className="mt-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>
          )}
          {!property?.id && (
            <p className="text-muted-foreground text-sm mt-1">
              Save the property first, then you can add images.
            </p>
          )}
          {imageUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {imageUrls.map((url) => (
                <div
                  key={url}
                  className="relative size-20 rounded-md border overflow-hidden bg-muted"
                >
                  <Image
                    src={url}
                    alt="Property"
                    width={80}
                    height={80}
                    className="object-cover size-full"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute top-0 right-0 rounded-bl bg-destructive/80 p-1 text-white hover:bg-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {property ? "Update" : "Create"} Property
          </Button>
        </div>
      </form>
    </Form>
  );
}
