"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DealForm } from "./deal-form";
import { PermissionGate } from "@/components/shared/permission-gate";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { deleteDeal } from "@/app/(dashboard)/crm/deals/actions";
import { toast } from "sonner";

interface Deal {
  id: string;
  reference: string | null;
  contact_name: string | null;
  type: string | null;
  stage: string | null;
  value: number;
  commission_amount: number;
  assigned_to_name: string | null;
  created_at: string;
}

interface DealsListProps {
  initialDeals: Deal[];
  companyId: string;
  leads: { id: string; full_name: string }[];
  contacts: { id: string; full_name: string }[];
  profiles: { id: string; full_name: string }[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; type: string; stage: string; assignee: string };
}

function buildDealsUrl(params: {
  page: number;
  pageSize: number;
  search: string;
  type: string;
  stage: string;
  assignee: string;
}): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.type !== "all") sp.set("type", params.type);
  if (params.stage !== "all") sp.set("stage", params.stage);
  if (params.assignee !== "all") sp.set("assignee", params.assignee);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function DealsList({
  initialDeals,
  companyId,
  leads,
  contacts,
  profiles,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: DealsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(filterParams.search);
  const [typeFilter, setTypeFilter] = useState<string>(filterParams.type);
  const [stageFilter, setStageFilter] = useState<string>(filterParams.stage);
  const [assigneeFilter, setAssigneeFilter] = useState<string>(filterParams.assignee);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteDealRow, setDeleteDealRow] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateUrl = useCallback(
    (updates: {
      page?: number;
      pageSize?: number;
      search?: string;
      type?: string;
      stage?: string;
      assignee?: string;
    }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      const searchNext = updates.search ?? search;
      const typeNext = updates.type ?? typeFilter;
      const stageNext = updates.stage ?? stageFilter;
      const assigneeNext = updates.assignee ?? assigneeFilter;
      router.push(
        pathname + buildDealsUrl({ page, pageSize: pageSizeNext, search: searchNext, type: typeNext, stage: stageNext, assignee: assigneeNext })
      );
    },
    [router, pathname, currentPage, pageSize, search, typeFilter, stageFilter, assigneeFilter]
  );

  const handleSearchSubmit = useCallback(() => {
    updateUrl({ page: 1, search });
  }, [updateUrl, search]);

  const handleTypeChange = useCallback(
    (value: string) => {
      setTypeFilter(value);
      updateUrl({ page: 1, type: value });
    },
    [updateUrl]
  );

  const handleStageChange = useCallback(
    (value: string) => {
      setStageFilter(value);
      updateUrl({ page: 1, stage: value });
    },
    [updateUrl]
  );

  const handleAssigneeChange = useCallback(
    (value: string) => {
      setAssigneeFilter(value);
      updateUrl({ page: 1, assignee: value });
    },
    [updateUrl]
  );

  async function handleConfirmDelete() {
    if (!deleteDealRow) return;
    setIsDeleting(true);
    try {
      await deleteDeal(deleteDealRow.id);
      toast.success("Deal deleted");
      setDeleteDealRow(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete deal");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              onBlur={handleSearchSubmit}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="rental">Rental</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={handleStageChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="contract_draft">Contract Draft</SelectItem>
              <SelectItem value="contract_signed">Contract Signed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={handleAssigneeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Deal
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {initialDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No deals yet. Add your first deal to get started."
                : "No deals match your filters."}
            </p>
            {totalCount === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Deal
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialDeals.map((deal) => (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/crm/deals/${deal.id}`)}
                >
                  <TableCell className="font-medium">
                    {deal.reference ?? "-"}
                  </TableCell>
                  <TableCell>{deal.contact_name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {deal.type ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">
                      {(deal.stage ?? "").replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(deal.value)}</TableCell>
                  <TableCell>{formatCurrency(deal.commission_amount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.assigned_to_name ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(deal.created_at)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <PermissionGate permission="canDelete">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDealRow(deal);
                        }}
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

      {totalCount > 0 && (
        <DataTablePagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(page) => updateUrl({ page })}
          onPageSizeChange={(size) => updateUrl({ page: 1, pageSize: size })}
        />
      )}

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Add Deal</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <DealForm
              companyId={companyId}
              leads={leads}
              contacts={contacts}
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

      <AlertDialog open={!!deleteDealRow} onOpenChange={(o) => !o && setDeleteDealRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDealRow?.reference ?? "this deal"}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() => handleConfirmDelete()}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
