"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { PermissionGate } from "@/components/shared/permission-gate";

type UnitRow = {
  id: string;
  unit_number: string;
  floor: number | null;
  size_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  type: string | null;
  status: string;
  rent_amount: number;
};

type TenantRow = {
  id: string;
  reference: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  status: string;
  unit_number: string;
};

type AmenityRow = {
  id: string;
  name: string;
  description: string | null;
};

interface PropertyDetailClientProps {
  propertyId: string;
  companyId: string;
  tab: "units" | "tenants" | "amenities" | "images";
  units?: UnitRow[];
  tenants?: TenantRow[];
  amenities?: AmenityRow[];
  images?: string[];
}

export function PropertyDetailClient({
  propertyId,
  companyId,
  tab,
  units = [],
  tenants = [],
  amenities = [],
  images = [],
}: PropertyDetailClientProps) {
  const router = useRouter();
  const [amenityName, setAmenityName] = useState("");
  const [amenityDesc, setAmenityDesc] = useState("");
  const [deleteAmenity, setDeleteAmenity] = useState<AmenityRow | null>(null);

  async function handleAddAmenity() {
    if (!amenityName.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("amenities").insert({
      property_id: propertyId,
      name: amenityName.trim(),
      description: amenityDesc.trim() || null,
      company_id: companyId,
    });
    if (error) {
      toast.error("Failed to add amenity");
      return;
    }
    toast.success("Amenity added");
    setAmenityName("");
    setAmenityDesc("");
    router.refresh();
  }

  async function handleDeleteAmenity(a: AmenityRow) {
    const supabase = createClient();
    const { error } = await supabase.from("amenities").delete().eq("id", a.id);
    if (error) {
      toast.error("Failed to delete amenity");
      return;
    }
    toast.success("Amenity removed");
    setDeleteAmenity(null);
    router.refresh();
  }

  if (tab === "units") {
    return (
      <div className="rounded-md border">
        {units.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">No units in this property yet.</p>
            <Button variant="outline" className="mt-2" asChild>
              <a href="/properties/units">Add units</a>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Size (sqft)</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Baths</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.unit_number}</TableCell>
                  <TableCell>{u.floor ?? "-"}</TableCell>
                  <TableCell>{u.size_sqft != null ? u.size_sqft : "-"}</TableCell>
                  <TableCell>{u.bedrooms ?? "-"}</TableCell>
                  <TableCell>{u.bathrooms ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {(u.type ?? "-").charAt(0).toUpperCase() + (u.type ?? "-").slice(1)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        u.status === "occupied"
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          : "bg-green-500/10 text-green-600 dark:text-green-400"
                      }
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(u.rent_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  }

  if (tab === "tenants") {
    return (
      <div className="rounded-md border">
        {tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">No tenants in this property yet.</p>
            <Button variant="outline" className="mt-2" asChild>
              <a href="/properties/tenants">Add tenant</a>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Lease</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-muted-foreground">{t.reference}</TableCell>
                  <TableCell className="font-medium">{t.full_name}</TableCell>
                  <TableCell>{t.unit_number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(t.lease_start)} – {formatDate(t.lease_end)}
                  </TableCell>
                  <TableCell>{formatCurrency(t.monthly_rent)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        t.status === "active"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : t.status === "expired"
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      {t.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  }

  if (tab === "amenities") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <Input
            placeholder="Amenity name"
            value={amenityName}
            onChange={(e) => setAmenityName(e.target.value)}
            className="max-w-[200px]"
          />
          <Input
            placeholder="Description (optional)"
            value={amenityDesc}
            onChange={(e) => setAmenityDesc(e.target.value)}
            className="max-w-[240px]"
          />
          <PermissionGate permission="canCreate">
            <Button onClick={handleAddAmenity} size="sm">
              <Plus className="mr-2 size-4" />
              Add
            </Button>
          </PermissionGate>
        </div>
        <div className="rounded-md border">
          {amenities.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No amenities added yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amenities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.description ?? "-"}</TableCell>
                    <TableCell>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteAmenity(a)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <AlertDialog open={!!deleteAmenity} onOpenChange={(o) => !o && setDeleteAmenity(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove amenity?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove &quot;{deleteAmenity?.name}&quot; from the list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteAmenity && handleDeleteAmenity(deleteAmenity)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (tab === "images") {
    return (
      <div className="rounded-md border p-4">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">No images for this property yet.</p>
            <p className="text-muted-foreground text-xs mt-1">
              Edit the property to add images.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((url) => (
              <div
                key={url}
                className="relative aspect-video rounded-lg overflow-hidden bg-muted"
              >
                <Image
                  src={url}
                  alt="Property"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
