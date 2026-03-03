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
import { formatDate } from "@/lib/utils";
import { ContactForm } from "./contact-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";
import { logAudit } from "@/lib/audit";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  type: string | null;
  notes: string | null;
  created_at: string;
}

interface ContactsTableProps {
  initialContacts: Contact[];
  companyId: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; type: string };
}

function buildContactsUrl(params: { page: number; pageSize: number; search: string; type: string }): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.type !== "all") sp.set("type", params.type);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function ContactsTable({
  initialContacts,
  companyId,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: ContactsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filterParams.search);
  const [typeFilter, setTypeFilter] = useState<string>(filterParams.type);
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  const contacts = initialContacts.filter((c) => !deletedIds.has(c.id));

  const updateUrl = useCallback(
    (updates: { page?: number; pageSize?: number; search?: string; type?: string }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      const searchNext = updates.search ?? search;
      const typeNext = updates.type ?? typeFilter;
      router.push(pathname + buildContactsUrl({ page, pageSize: pageSizeNext, search: searchNext, type: typeNext }));
    },
    [router, pathname, currentPage, pageSize, search, typeFilter]
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

  async function handleDelete(contact: Contact) {
    const supabase = createClient();
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contact.id);

    if (error) {
      toast.error("Failed to delete contact");
      return;
    }
    await logAudit({
      action: "deleted",
      resourceType: "contact",
      resourceId: contact.id,
      resourceReference: contact.full_name,
      oldValues: { full_name: contact.full_name },
      companyId,
    });
    setDeletedIds((prev) => new Set(prev).add(contact.id));
    setDeleteContact(null);
    toast.success("Contact deleted");
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
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              onBlur={handleSearchSubmit}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
              <SelectItem value="landlord">Landlord</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Contact
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No contacts yet. Add your first contact to get started."
                : "No contacts match your filters."}
            </p>
            {totalCount === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Contact
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
                <TableHead>Type</TableHead>
                <TableHead>Date added</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.email ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.phone ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {contact.type ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(contact.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditContact(contact)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteContact(contact)}
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
            <SheetTitle>Add Contact</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <ContactForm
              companyId={companyId}
              onSuccess={() => {
                router.refresh();
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editContact} onOpenChange={(o) => !o && setEditContact(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editContact && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Contact</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <ContactForm
                  contact={editContact}
                  companyId={companyId}
                  onSuccess={() => {
                    router.refresh();
                    setEditContact(null);
                  }}
                  onCancel={() => setEditContact(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteContact}
        onOpenChange={(o) => !o && setDeleteContact(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteContact?.full_name}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteContact && handleDelete(deleteContact)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
