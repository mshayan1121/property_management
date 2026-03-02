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
import { Plus, Search, Pencil, Trash2, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ContractForm } from "./contract-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  expired: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  terminated: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface Contract {
  id: string;
  reference: string | null;
  deal_id: string | null;
  contact_id: string | null;
  contact_name: string | null;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  value: number;
  status: string;
  document_url: string | null;
  notes: string | null;
}

interface ContractsTableProps {
  initialContracts: Contract[];
  companyId: string;
  deals: { id: string; reference: string | null }[];
  contacts: { id: string; full_name: string }[];
}

export function ContractsTable({
  initialContracts,
  companyId,
  deals,
  contacts,
}: ContractsTableProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [deleteContract, setDeleteContract] = useState<Contract | null>(null);

  const contracts = initialContracts.filter((c) => !deletedIds.has(c.id));

  const filteredContracts = contracts.filter((contract) => {
    const matchSearch =
      !search ||
      (contract.reference?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (contract.contact_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchType = typeFilter === "all" || contract.type === typeFilter;
    const matchStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  async function handleDelete(contract: Contract) {
    const supabase = createClient();
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contract.id);

    if (error) {
      toast.error("Failed to delete contract");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(contract.id));
    setDeleteContract(null);
    toast.success("Contract deleted");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="rental">Rental</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Contract
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {filteredContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {contracts.length === 0
                ? "No contracts yet. Add your first contract to get started."
                : "No contracts match your filters."}
            </p>
            {contracts.length === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Contract
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
                <TableHead>Start date</TableHead>
                <TableHead>End date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.reference ?? "-"}
                  </TableCell>
                  <TableCell>{contract.contact_name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {contract.type ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contract.start_date
                      ? formatDate(contract.start_date)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contract.end_date
                      ? formatDate(contract.end_date)
                      : "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(contract.value)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        STATUS_COLORS[contract.status] ?? "bg-muted"
                      }
                    >
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {contract.document_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          asChild
                        >
                          <a
                            href={contract.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download"
                          >
                            <Download className="size-4" />
                          </a>
                        </Button>
                      )}
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditContract(contract)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteContract(contract)}
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
            <SheetTitle>Add Contract</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <ContractForm
              companyId={companyId}
              deals={deals}
              contacts={contacts}
              onSuccess={() => {
                router.refresh();
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editContract}
        onOpenChange={(o) => !o && setEditContract(null)}
      >
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editContract && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Contract</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <ContractForm
                  contract={editContract}
                  companyId={companyId}
                  deals={deals}
                  contacts={contacts}
                  onSuccess={() => {
                    router.refresh();
                    setEditContract(null);
                  }}
                  onCancel={() => setEditContract(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteContract}
        onOpenChange={(o) => !o && setDeleteContract(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteContract?.reference}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteContract && handleDelete(deleteContract)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
