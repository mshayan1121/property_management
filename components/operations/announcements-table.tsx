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
import { Plus, Search, Pencil, Trash2, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AnnouncementForm } from "./announcement-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";
import { parseISO, isValid } from "date-fns";
import { format } from "date-fns";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

const TYPE_COLORS: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  maintenance: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  emergency: "bg-red-500/10 text-red-600 dark:text-red-400",
  event: "bg-green-500/10 text-green-600 dark:text-green-400",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-500/10 text-green-600 dark:text-green-400",
  archived: "bg-muted text-muted-foreground",
};

function formatPublishedAt(publishedAt: string | null): string {
  if (!publishedAt) return "—";
  const d = parseISO(publishedAt);
  if (!isValid(d)) return "—";
  return format(d, "dd/MM/yyyy");
}

interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  type: string;
  property_name: string | null;
  status: string;
  published_at: string | null;
  property_id: string | null;
}

interface AnnouncementsTableProps {
  initialAnnouncements: AnnouncementRow[];
  companyId: string;
  properties: { id: string; reference: string; name: string }[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; type: string; status: string };
}

function buildAnnouncementsUrl(params: { page: number; pageSize: number; search: string; type: string; status: string }): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.type !== "all") sp.set("type", params.type);
  if (params.status !== "all") sp.set("status", params.status);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function AnnouncementsTable({
  initialAnnouncements,
  companyId,
  properties,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: AnnouncementsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filterParams.search);
  const [typeFilter, setTypeFilter] = useState<string>(filterParams.type);
  const [statusFilter, setStatusFilter] = useState<string>(filterParams.status);
  const [addOpen, setAddOpen] = useState(false);
  const [editAnn, setEditAnn] = useState<AnnouncementRow | null>(null);
  const [deleteAnn, setDeleteAnn] = useState<AnnouncementRow | null>(null);

  const announcements = initialAnnouncements.filter((a) => !deletedIds.has(a.id));

  const updateUrl = useCallback(
    (updates: { page?: number; pageSize?: number; search?: string; type?: string; status?: string }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      const searchNext = updates.search ?? search;
      const typeNext = updates.type ?? typeFilter;
      const statusNext = updates.status ?? statusFilter;
      router.push(pathname + buildAnnouncementsUrl({ page, pageSize: pageSizeNext, search: searchNext, type: typeNext, status: statusNext }));
    },
    [router, pathname, currentPage, pageSize, search, typeFilter, statusFilter]
  );

  const handleSearchSubmit = useCallback(() => updateUrl({ page: 1, search }), [updateUrl, search]);
  const handleTypeChange = useCallback((v: string) => { setTypeFilter(v); updateUrl({ page: 1, type: v }); }, [updateUrl]);
  const handleStatusChange = useCallback((v: string) => { setStatusFilter(v); updateUrl({ page: 1, status: v }); }, [updateUrl]);

  async function handleDelete(ann: AnnouncementRow) {
    const supabase = createClient();
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", ann.id);

    if (error) {
      toast.error("Failed to delete announcement");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(ann.id));
    setDeleteAnn(null);
    toast.success("Announcement deleted");
    router.refresh();
  }

  async function handlePublish(ann: AnnouncementRow) {
    const supabase = createClient();
    const { error } = await supabase
      .from("announcements")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", ann.id);

    if (error) {
      toast.error("Failed to publish announcement");
      return;
    }
    toast.success("Announcement published");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
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
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="event">Event</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Announcement
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No announcements yet."
                : "No announcements match your filters."}
            </p>
            {totalCount === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Announcement
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published date</TableHead>
                <TableHead className="w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        TYPE_COLORS[a.type] ?? "bg-muted"
                      }`}
                    >
                      {a.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.property_name ?? "Company-wide"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[a.status] ?? "bg-muted"
                      }`}
                    >
                      {a.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPublishedAt(a.published_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {a.status === "draft" && (
                        <PermissionGate permission="canEdit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Publish"
                            onClick={() => handlePublish(a)}
                          >
                            <Send className="size-4" />
                          </Button>
                        </PermissionGate>
                      )}
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditAnn(a)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteAnn(a)}
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
            <SheetTitle>Add announcement</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <AnnouncementForm
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

      <Sheet open={!!editAnn} onOpenChange={(o) => !o && setEditAnn(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editAnn && (
            <>
              <SheetHeader>
                <SheetTitle>Edit announcement</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <AnnouncementForm
                  announcement={{
                    id: editAnn.id,
                    title: editAnn.title,
                    content: editAnn.content,
                    type: editAnn.type,
                    property_id: editAnn.property_id,
                    status: editAnn.status,
                  }}
                  companyId={companyId}
                  properties={properties}
                  onSuccess={() => {
                    router.refresh();
                    setEditAnn(null);
                  }}
                  onCancel={() => setEditAnn(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteAnn}
        onOpenChange={(o) => !o && setDeleteAnn(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteAnn?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteAnn && handleDelete(deleteAnn)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
