"use client";

import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { PropertyForm } from "./property-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";

const TYPE_COLORS: Record<string, string> = {
  residential: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  commercial: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
};

export interface PropertyRow {
  id: string;
  reference: string;
  name: string;
  type: string | null;
  location: string;
  address: string | null;
  total_units: number;
  occupied: number;
  occupancyPct: number;
  status: string;
  images: string[] | null;
}

interface PropertiesTableProps {
  initialProperties: PropertyRow[];
  companyId: string;
}

export function PropertiesTable({
  initialProperties,
  companyId,
}: PropertiesTableProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const properties = initialProperties.filter((p) => !deletedIds.has(p.id));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<PropertyRow | null>(null);
  const [deleteProperty, setDeleteProperty] = useState<PropertyRow | null>(null);

  const refresh = useCallback(() => {
    router.refresh();
    setAddOpen(false);
    setEditProperty(null);
    setDeleteProperty(null);
  }, [router]);

  const filtered = properties.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  async function handleDelete(prop: PropertyRow) {
    const supabase = createClient();
    const { error } = await supabase.from("properties").delete().eq("id", prop.id);
    if (error) {
      toast.error("Failed to delete property");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(prop.id));
    setDeleteProperty(null);
    toast.success("Property deleted");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Property
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {properties.length === 0
                ? "No properties yet. Add your first property to get started."
                : "No properties match your filters."}
            </p>
            {properties.length === 0 && (
              <PermissionGate permission="canCreate">
                <Button variant="outline" className="mt-4" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Add Property
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Total units</TableHead>
                <TableHead>Occupied</TableHead>
                <TableHead>Occupancy %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/properties/listings/${p.id}`)}
                >
                  <TableCell className="font-mono text-muted-foreground">{p.reference}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={TYPE_COLORS[p.type ?? ""] ?? "bg-muted"}>
                      {(p.type ?? "-").charAt(0).toUpperCase() + (p.type ?? "-").slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.location}</TableCell>
                  <TableCell>{p.total_units}</TableCell>
                  <TableCell>{p.occupied}</TableCell>
                  <TableCell>{p.occupancyPct}%</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_COLORS[p.status] ?? "bg-muted"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditProperty(p);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteProperty(p);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Add Property</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <PropertyForm
              companyId={companyId}
              onSuccess={refresh}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editProperty} onOpenChange={(o) => !o && setEditProperty(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editProperty && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Property</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <PropertyForm
                  property={{
                    id: editProperty.id,
                    name: editProperty.name,
                    type: editProperty.type,
                    location: editProperty.location,
                    address: editProperty.address,
                    total_units: editProperty.total_units,
                    status: editProperty.status,
                    images: editProperty.images,
                  }}
                  companyId={companyId}
                  onSuccess={refresh}
                  onCancel={() => setEditProperty(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteProperty} onOpenChange={(o) => !o && setDeleteProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteProperty?.name}. All units and amenities under
              this property will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteProperty && handleDelete(deleteProperty)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
