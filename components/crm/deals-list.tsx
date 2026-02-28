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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DealForm } from "./deal-form";

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
}

export function DealsList({
  initialDeals,
  companyId,
  leads,
  contacts,
  profiles,
}: DealsListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);

  const filteredDeals = initialDeals.filter((deal) => {
    const matchSearch =
      !search ||
      (deal.reference?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (deal.contact_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchType = typeFilter === "all" || deal.type === typeFilter;
    const matchStage = stageFilter === "all" || deal.stage === stageFilter;
    const matchAssignee =
      assigneeFilter === "all" || deal.assigned_to_name === assigneeFilter;
    return matchSearch && matchType && matchStage && matchAssignee;
  });

  const assignees = [...new Set(initialDeals.map((d) => d.assigned_to_name).filter(Boolean))];

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
          <Select value={stageFilter} onValueChange={setStageFilter}>
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
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {assignees.map((a) => (
                <SelectItem key={a!} value={a!}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add Deal
        </Button>
      </div>

      <div className="rounded-md border">
        {filteredDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {initialDeals.length === 0
                ? "No deals yet. Add your first deal to get started."
                : "No deals match your filters."}
            </p>
            {initialDeals.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 size-4" />
                Add Deal
              </Button>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Deal</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
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
    </>
  );
}
