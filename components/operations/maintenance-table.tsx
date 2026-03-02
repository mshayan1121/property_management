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
import { Plus, Search, Pencil, Trash2, FileOutput } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MaintenanceForm } from "./maintenance-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-muted text-muted-foreground",
  assigned: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface MaintenanceRow {
  id: string;
  reference: string;
  title: string;
  property_name: string | null;
  unit_number: string | null;
  tenant_name: string | null;
  category: string | null;
  priority: string;
  status: string;
  estimated_cost: number;
  description: string | null;
  property_id: string | null;
  unit_id: string | null;
  tenant_id: string | null;
  assigned_to: string | null;
  actual_cost: number;
}

interface MaintenanceTableProps {
  initialRequests: MaintenanceRow[];
  companyId: string;
  properties: { id: string; reference: string; name: string }[];
  units: { id: string; unit_number: string; property_id: string }[];
  tenants: { id: string; full_name: string; reference: string }[];
  profiles: { id: string; full_name: string }[];
}

export function MaintenanceTable({
  initialRequests,
  companyId,
  properties,
  units,
  tenants,
  profiles,
}: MaintenanceTableProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<MaintenanceRow | null>(null);
  const [detailRequest, setDetailRequest] = useState<MaintenanceRow | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<MaintenanceRow | null>(null);

  const requests = initialRequests.filter((r) => !deletedIds.has(r.id));

  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.reference.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchCategory = categoryFilter === "all" || r.category === categoryFilter;
    const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;
    const matchProperty = propertyFilter === "all" || r.property_id === propertyFilter;
    return matchSearch && matchStatus && matchCategory && matchPriority && matchProperty;
  });

  async function handleDelete(request: MaintenanceRow) {
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_requests")
      .delete()
      .eq("id", request.id);

    if (error) {
      toast.error("Failed to delete maintenance request");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(request.id));
    setDeleteRequest(null);
    setDetailRequest(null);
    toast.success("Maintenance request deleted");
    router.refresh();
  }

  async function handleGenerateWorkOrder(request: MaintenanceRow) {
    const supabase = createClient();
    const { data: wo, error } = await supabase
      .from("work_orders")
      .insert({
        maintenance_request_id: request.id,
        title: `WO for ${request.reference}: ${request.title}`,
        company_id: companyId,
        status: "pending",
        estimated_cost: request.estimated_cost,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Failed to create work order");
      return;
    }
    toast.success("Work order created");
    setDetailRequest(null);
    router.refresh();
    router.push("/operations/work-orders");
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="structural">Structural</SelectItem>
              <SelectItem value="appliance">Appliance</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
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
          Add Request
        </Button>
      </div>

      <div className="rounded-md border">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {requests.length === 0
                ? "No maintenance requests yet."
                : "No requests match your filters."}
            </p>
            {requests.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 size-4" />
                Add Request
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Est. cost (AED)</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => setDetailRequest(r)}
                >
                  <TableCell className="font-medium">{r.reference}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.property_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.unit_number ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.tenant_name ?? "—"}
                  </TableCell>
                  <TableCell className="capitalize">{r.category ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        PRIORITY_COLORS[r.priority] ?? "bg-muted"
                      }`}
                    >
                      {r.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[r.status] ?? "bg-muted"
                      }`}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.estimated_cost)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Generate work order"
                        onClick={() => handleGenerateWorkOrder(r)}
                      >
                        <FileOutput className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditRequest(r)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteRequest(r)}
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
            <SheetTitle>Add Maintenance Request</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <MaintenanceForm
              companyId={companyId}
              properties={properties}
              units={units}
              tenants={tenants}
              profiles={profiles}
              onSuccess={() => {
                router.refresh();
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editRequest} onOpenChange={(o) => !o && setEditRequest(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editRequest && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Maintenance Request</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <MaintenanceForm
                  request={{
                    id: editRequest.id,
                    reference: editRequest.reference,
                    title: editRequest.title,
                    description: editRequest.description,
                    property_id: editRequest.property_id,
                    unit_id: editRequest.unit_id,
                    tenant_id: editRequest.tenant_id,
                    category: editRequest.category,
                    priority: editRequest.priority,
                    status: editRequest.status,
                    assigned_to: editRequest.assigned_to,
                    estimated_cost: editRequest.estimated_cost,
                    actual_cost: editRequest.actual_cost,
                  }}
                  companyId={companyId}
                  properties={properties}
                  units={units}
                  tenants={tenants}
                  profiles={profiles}
                  onSuccess={() => {
                    router.refresh();
                    setEditRequest(null);
                    setDetailRequest(null);
                  }}
                  onCancel={() => setEditRequest(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!detailRequest} onOpenChange={(o) => !o && setDetailRequest(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {detailRequest && (
            <>
              <SheetHeader>
                <SheetTitle>{detailRequest.reference}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 p-6 pt-0">
                <div>
                  <p className="font-medium">{detailRequest.title}</p>
                  {detailRequest.description && (
                    <p className="mt-1 text-muted-foreground text-sm">
                      {detailRequest.description}
                    </p>
                  )}
                </div>
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Property</dt>
                    <dd>{detailRequest.property_name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Unit</dt>
                    <dd>{detailRequest.unit_number ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tenant</dt>
                    <dd>{detailRequest.tenant_name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="capitalize">{detailRequest.category ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Priority</dt>
                    <dd>{detailRequest.priority}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>{detailRequest.status.replace("_", " ")}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Estimated cost</dt>
                    <dd>{formatCurrency(detailRequest.estimated_cost)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Actual cost</dt>
                    <dd>{formatCurrency(detailRequest.actual_cost)}</dd>
                  </div>
                </dl>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailRequest(null);
                      setEditRequest(detailRequest);
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleGenerateWorkOrder(detailRequest)}
                  >
                    <FileOutput className="mr-2 size-4" />
                    Generate Work Order
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteRequest}
        onOpenChange={(o) => !o && setDeleteRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete maintenance request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteRequest?.reference}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteRequest && handleDelete(deleteRequest)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
