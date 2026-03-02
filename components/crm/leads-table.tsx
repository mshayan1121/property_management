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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { LeadForm } from "./lead-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  contacted: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  qualified: "bg-green-500/10 text-green-600 dark:text-green-400",
  lost: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
}

interface LeadsTableProps {
  initialLeads: Lead[];
  profiles: { id: string; full_name: string }[];
  companyId: string;
}

export function LeadsTable({
  initialLeads,
  profiles,
  companyId,
}: LeadsTableProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const leads = initialLeads.filter((l) => !deletedIds.has(l.id));
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);

  const refresh = useCallback(() => {
    router.refresh();
    setAddOpen(false);
    setDetailLead(null);
    setEditLead(null);
    setDeleteLead(null);
  }, [router]);

  const filteredLeads = leads.filter((lead) => {
    const matchSearch =
      !search ||
      lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (lead.phone?.includes(search) ?? false);
    const matchSource =
      sourceFilter === "all" || lead.source === sourceFilter;
    const matchStatus =
      statusFilter === "all" || lead.status === statusFilter;
    return matchSearch && matchSource && matchStatus;
  });

  async function handleDelete(lead: Lead) {
    const supabase = createClient();
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) {
      toast.error("Failed to delete lead");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(lead.id));
    setDeleteLead(null);
    toast.success("Lead deleted");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="portal">Portal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Lead
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {leads.length === 0
                ? "No leads yet. Add your first lead to get started."
                : "No leads match your filters."}
            </p>
            {leads.length === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Lead
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() => setDetailLead(lead)}
                >
                  <TableCell className="font-medium">{lead.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.email ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.phone ?? "-"}
                  </TableCell>
                  <TableCell>
                    {(lead.source ?? "-").charAt(0).toUpperCase() +
                      (lead.source ?? "-").slice(1)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[lead.status] ?? "bg-muted"}
                    >
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.profiles?.full_name ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(lead.created_at)}
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
                            setEditLead(lead);
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
                            setDeleteLead(lead);
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
            <SheetTitle>Add Lead</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <LeadForm
              companyId={companyId}
              profiles={profiles}
              onSuccess={refresh}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!detailLead} onOpenChange={(o) => !o && setDetailLead(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {detailLead && (
            <>
              <SheetHeader>
                <SheetTitle>{detailLead.full_name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 p-6 pt-0">
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <p>{detailLead.email ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Phone</p>
                  <p>{detailLead.phone ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Source</p>
                  <p>
                    {(detailLead.source ?? "-").charAt(0).toUpperCase() +
                      (detailLead.source ?? "-").slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Status</p>
                  <Badge
                    variant="secondary"
                    className={
                      STATUS_COLORS[detailLead.status] ?? "bg-muted"
                    }
                  >
                    {detailLead.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Assigned to</p>
                  <p>{detailLead.profiles?.full_name ?? "-"}</p>
                </div>
                {detailLead.notes && (
                  <div>
                    <p className="text-muted-foreground text-sm">Notes</p>
                    <p className="whitespace-pre-wrap">{detailLead.notes}</p>
                  </div>
                )}
                <PermissionGate permission="canEdit">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditLead(detailLead);
                      setDetailLead(null);
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit Lead
                  </Button>
                </PermissionGate>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!editLead} onOpenChange={(o) => !o && setEditLead(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editLead && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Lead</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <LeadForm
                  lead={editLead}
                  companyId={companyId}
                  profiles={profiles}
                  onSuccess={() => {
                    router.refresh();
                    setEditLead(null);
                  }}
                  onCancel={() => setEditLead(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteLead} onOpenChange={(o) => !o && setDeleteLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteLead?.full_name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteLead && handleDelete(deleteLead)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
