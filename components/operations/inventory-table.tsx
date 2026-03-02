"use client";

import { useState } from "react";
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
import { InventoryForm } from "./inventory-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-600 dark:text-green-400",
  low_stock: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  out_of_stock: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface InventoryRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  property_name: string | null;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  status: string;
  property_id: string | null;
}

interface InventoryTableProps {
  initialItems: InventoryRow[];
  companyId: string;
  properties: { id: string; reference: string; name: string }[];
}

export function InventoryTable({
  initialItems,
  companyId,
  properties,
}: InventoryTableProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryRow | null>(null);

  const items = initialItems.filter((i) => !deletedIds.has(i.id));

  const filtered = items.filter((i) => {
    const matchSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || i.category === categoryFilter;
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    const matchProperty = propertyFilter === "all" || i.property_id === propertyFilter;
    return matchSearch && matchCategory && matchStatus && matchProperty;
  });

  function isLowStock(row: InventoryRow): boolean {
    return row.quantity <= row.minimum_quantity && row.status !== "out_of_stock";
  }

  async function handleDelete(item: InventoryRow) {
    const supabase = createClient();
    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete item");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(item.id));
    setDeleteItem(null);
    toast.success("Item deleted");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="appliance">Appliance</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="supplies">Supplies</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="low_stock">Low stock</SelectItem>
              <SelectItem value="out_of_stock">Out of stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.reference}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add Item
        </Button>
      </div>

      <div className="rounded-md border">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {items.length === 0
                ? "No inventory items yet."
                : "No items match your filters."}
            </p>
            {items.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 size-4" />
                Add Item
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Min. quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow
                  key={i.id}
                  className={
                    isLowStock(i) ? "bg-orange-500/5" : undefined
                  }
                >
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell className="capitalize">{i.category ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {i.property_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{i.quantity}</TableCell>
                  <TableCell>{i.unit}</TableCell>
                  <TableCell className="text-right">{i.minimum_quantity}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[i.status] ?? "bg-muted"
                      }`}
                    >
                      {i.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditItem(i)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteItem(i)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
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
            <SheetTitle>Add inventory item</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <InventoryForm
              companyId={companyId}
              properties={properties}
              onSuccess={() => {
                router.refresh();
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editItem && (
            <>
              <SheetHeader>
                <SheetTitle>Edit inventory item</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <InventoryForm
                  item={{
                    id: editItem.id,
                    name: editItem.name,
                    description: editItem.description,
                    category: editItem.category,
                    property_id: editItem.property_id,
                    quantity: editItem.quantity,
                    unit: editItem.unit,
                    minimum_quantity: editItem.minimum_quantity,
                    status: editItem.status,
                  }}
                  companyId={companyId}
                  properties={properties}
                  onSuccess={() => {
                    router.refresh();
                    setEditItem(null);
                  }}
                  onCancel={() => setEditItem(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteItem?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteItem && handleDelete(deleteItem)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
