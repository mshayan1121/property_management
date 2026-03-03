"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProjectForm } from "./project-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface ProjectRow {
  id: string;
  reference: string;
  name: string;
  description: string | null;
  property_id: string | null;
  property_name: string | null;
  category: string | null;
  priority: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
  budget: number;
  assigned_to: string | null;
}

interface ProjectsTableProps {
  initialProjects: ProjectRow[];
  companyId: string;
  properties: { id: string; reference: string; name: string }[];
  profiles: { id: string; full_name: string }[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; status: string; category: string; priority: string };
}

function buildProjectsUrl(params: { page: number; pageSize: number; search: string; status: string; category: string; priority: string }): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.status !== "all") sp.set("status", params.status);
  if (params.category !== "all") sp.set("category", params.category);
  if (params.priority !== "all") sp.set("priority", params.priority);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function ProjectsTable({
  initialProjects,
  companyId,
  properties,
  profiles,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: ProjectsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filterParams.search);
  const [statusFilter, setStatusFilter] = useState<string>(filterParams.status);
  const [categoryFilter, setCategoryFilter] = useState<string>(filterParams.category);
  const [priorityFilter, setPriorityFilter] = useState<string>(filterParams.priority);
  const [addOpen, setAddOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectRow | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectRow | null>(null);

  const projects = initialProjects.filter((p) => !deletedIds.has(p.id));

  const updateUrl = useCallback(
    (updates: { page?: number; pageSize?: number; search?: string; status?: string; category?: string; priority?: string }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      const searchNext = updates.search ?? search;
      const statusNext = updates.status ?? statusFilter;
      const categoryNext = updates.category ?? categoryFilter;
      const priorityNext = updates.priority ?? priorityFilter;
      router.push(pathname + buildProjectsUrl({ page, pageSize: pageSizeNext, search: searchNext, status: statusNext, category: categoryNext, priority: priorityNext }));
    },
    [router, pathname, currentPage, pageSize, search, statusFilter, categoryFilter, priorityFilter]
  );

  const handleSearchSubmit = useCallback(() => updateUrl({ page: 1, search }), [updateUrl, search]);
  const handleStatusChange = useCallback((v: string) => { setStatusFilter(v); updateUrl({ page: 1, status: v }); }, [updateUrl]);
  const handleCategoryChange = useCallback((v: string) => { setCategoryFilter(v); updateUrl({ page: 1, category: v }); }, [updateUrl]);
  const handlePriorityChange = useCallback((v: string) => { setPriorityFilter(v); updateUrl({ page: 1, priority: v }); }, [updateUrl]);

  async function handleDelete(project: ProjectRow) {
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", project.id);

    if (error) {
      toast.error("Failed to delete project");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(project.id));
    setDeleteProject(null);
    toast.success("Project deleted");
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
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              onBlur={handleSearchSubmit}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="renovation">Renovation</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="construction">Construction</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={handlePriorityChange}>
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
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Project
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No projects yet. Add your first project."
                : "No projects match your filters."}
            </p>
            {totalCount === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Project
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
                <TableHead>Property</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Budget (AED)</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/operations/projects/${p.id}`)}
                >
                  <TableCell className="font-medium">{p.reference}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.property_name ?? "—"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {p.category ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        PRIORITY_COLORS[p.priority] ?? "bg-muted"
                      }`}
                    >
                      {p.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[p.status] ?? "bg-muted"
                      }`}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.due_date ? formatDate(p.due_date) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(p.budget)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditProject(p)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteProject(p)}
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
            <SheetTitle>Add Project</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <ProjectForm
              companyId={companyId}
              properties={properties}
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

      <Sheet open={!!editProject} onOpenChange={(o) => !o && setEditProject(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editProject && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Project</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <ProjectForm
                  project={{
                    id: editProject.id,
                    reference: editProject.reference,
                    name: editProject.name,
                    description: editProject.description,
                    property_id: editProject.property_id,
                    category: editProject.category,
                    priority: editProject.priority,
                    status: editProject.status,
                    start_date: editProject.start_date,
                    due_date: editProject.due_date,
                    budget: editProject.budget,
                    assigned_to: editProject.assigned_to,
                  }}
                  companyId={companyId}
                  properties={properties}
                  profiles={profiles}
                  onSuccess={() => {
                    router.refresh();
                    setEditProject(null);
                  }}
                  onCancel={() => setEditProject(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteProject}
        onOpenChange={(o) => !o && setDeleteProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteProject?.reference}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteProject && handleDelete(deleteProject)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
