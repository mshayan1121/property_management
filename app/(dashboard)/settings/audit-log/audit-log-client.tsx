"use client";

import { Fragment, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  resource_type: string;
  resource_reference: string;
  user_email: string;
  created_at: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
}

interface AuditLogClientProps {
  items: AuditLogItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  filters: {
    action: string;
    resource_type: string;
    from: string;
    to: string;
    q: string;
  };
}

export function AuditLogClient({
  items,
  totalCount,
  totalPages,
  currentPage,
  filters,
}: AuditLogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localQ, setLocalQ] = useState(filters.q);
  const [localFrom, setLocalFrom] = useState(filters.from);
  const [localTo, setLocalTo] = useState(filters.to);

  function buildUrl(updates: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    p.set("page", "1");
    return `/settings/audit-log?${p.toString()}`;
  }

  function applyFilters() {
    const p = new URLSearchParams(searchParams.toString());
    if (localQ) p.set("q", localQ);
    else p.delete("q");
    if (localFrom) p.set("from", localFrom);
    else p.delete("from");
    if (localTo) p.set("to", localTo);
    else p.delete("to");
    p.set("page", "1");
    router.push(`/settings/audit-log?${p.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <Select
          value={filters.action || "all"}
          onValueChange={(v) => router.push(buildUrl({ action: v === "all" ? "" : v }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.resource_type || "all"}
          onValueChange={(v) => router.push(buildUrl({ resource_type: v === "all" ? "" : v }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Resource type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="deal">Deal</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="property">Property</SelectItem>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="profile">Profile</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground text-sm">From</label>
          <Input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            className="w-[140px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground text-sm">To</label>
          <Input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            className="w-[140px]"
          />
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="User email or reference..."
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="pl-9"
          />
        </div>
        <Button variant="secondary" onClick={applyFilters}>
          Apply
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Action</TableHead>
              <TableHead>Resource type</TableHead>
              <TableHead>Resource reference</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date / time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center py-8">
                  No audit entries found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <Fragment key={item.id}>
                  <TableRow key={item.id}>
                    <TableCell className="w-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        aria-expanded={expandedId === item.id}
                      >
                        {expandedId === item.id ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="capitalize">{item.action}</TableCell>
                    <TableCell className="capitalize">{item.resource_type.replace(/_/g, " ")}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.resource_reference}>
                      {item.resource_reference}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate" title={item.user_email}>
                      {item.user_email}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{item.created_at}</TableCell>
                  </TableRow>
                  {expandedId === item.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30 p-4">
                        <div className="grid gap-4 text-sm md:grid-cols-2">
                          {item.old_values && Object.keys(item.old_values).length > 0 && (
                            <div>
                              <p className="font-medium mb-1">Previous values</p>
                              <pre className="rounded border bg-background p-3 overflow-auto max-h-40 text-xs">
                                {JSON.stringify(item.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {item.new_values && Object.keys(item.new_values).length > 0 && (
                            <div>
                              <p className="font-medium mb-1">New values</p>
                              <pre className="rounded border bg-background p-3 overflow-auto max-h-40 text-xs">
                                {JSON.stringify(item.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {(!item.old_values || Object.keys(item.old_values).length === 0) &&
                            (!item.new_values || Object.keys(item.new_values).length === 0) && (
                              <p className="text-muted-foreground">No value details</p>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {(currentPage - 1) * 50 + 1}–{Math.min(currentPage * 50, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const p = new URLSearchParams(searchParams.toString());
                p.set("page", String(currentPage - 1));
                router.push(`/settings/audit-log?${p.toString()}`);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const p = new URLSearchParams(searchParams.toString());
                p.set("page", String(currentPage + 1));
                router.push(`/settings/audit-log?${p.toString()}`);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
