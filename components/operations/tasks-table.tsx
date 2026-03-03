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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TaskForm } from "./task-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PermissionGate } from "@/components/shared/permission-gate";
import { parseISO, isBefore } from "date-fns";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface TaskRow {
  id: string;
  reference: string;
  title: string;
  project_name: string | null;
  assigned_name: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  project_id: string | null;
  description: string | null;
  assigned_to: string | null;
}

interface TasksTableProps {
  initialTasks: TaskRow[];
  companyId: string;
  projects: { id: string; reference: string; name: string }[];
  profiles: { id: string; full_name: string }[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; status: string; priority: string; project: string };
}

function buildTasksUrl(params: { page: number; pageSize: number; search: string; status: string; priority: string; project: string }): string {
  const sp = new URLSearchParams();
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize !== 10) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.status !== "all") sp.set("status", params.status);
  if (params.priority !== "all") sp.set("priority", params.priority);
  if (params.project !== "all") sp.set("project", params.project);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function TasksTable({
  initialTasks,
  companyId,
  projects,
  profiles,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: TasksTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filterParams.search);
  const [statusFilter, setStatusFilter] = useState<string>(filterParams.status);
  const [priorityFilter, setPriorityFilter] = useState<string>(filterParams.priority);
  const [projectFilter, setProjectFilter] = useState<string>(filterParams.project);
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskRow | null>(null);
  const [deleteTask, setDeleteTask] = useState<TaskRow | null>(null);

  const tasks = initialTasks.filter((t) => !deletedIds.has(t.id));

  const updateUrl = useCallback(
    (updates: { page?: number; pageSize?: number; search?: string; status?: string; priority?: string; project?: string }) => {
      const page = updates.page ?? currentPage;
      const pageSizeNext = updates.pageSize ?? pageSize;
      const searchNext = updates.search ?? search;
      const statusNext = updates.status ?? statusFilter;
      const priorityNext = updates.priority ?? priorityFilter;
      const projectNext = updates.project ?? projectFilter;
      router.push(pathname + buildTasksUrl({ page, pageSize: pageSizeNext, search: searchNext, status: statusNext, priority: priorityNext, project: projectNext }));
    },
    [router, pathname, currentPage, pageSize, search, statusFilter, priorityFilter, projectFilter]
  );

  const handleSearchSubmit = useCallback(() => updateUrl({ page: 1, search }), [updateUrl, search]);
  const handleStatusChange = useCallback((v: string) => { setStatusFilter(v); updateUrl({ page: 1, status: v }); }, [updateUrl]);
  const handlePriorityChange = useCallback((v: string) => { setPriorityFilter(v); updateUrl({ page: 1, priority: v }); }, [updateUrl]);
  const handleProjectChange = useCallback((v: string) => { setProjectFilter(v); updateUrl({ page: 1, project: v }); }, [updateUrl]);

  function isOverdue(dueDate: string | null, status: string): boolean {
    if (!dueDate || status === "completed" || status === "cancelled")
      return false;
    return isBefore(parseISO(dueDate), new Date());
  }

  async function handleDelete(task: TaskRow) {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);

    if (error) {
      toast.error("Failed to delete task");
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(task.id));
    setDeleteTask(null);
    toast.success("Task deleted");
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
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
          <Select value={projectFilter} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.reference}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="canCreate">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Task
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-md border">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {totalCount === 0
                ? "No tasks yet. Add your first task."
                : "No tasks match your filters."}
            </p>
            {totalCount === 0 && (
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add Task
                </Button>
              </PermissionGate>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.reference}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.project_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.assigned_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        PRIORITY_COLORS[t.priority] ?? "bg-muted"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[t.status] ?? "bg-muted"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell
                    className={
                      isOverdue(t.due_date, t.status)
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {t.due_date ? formatDate(t.due_date) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <PermissionGate permission="canEdit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditTask(t)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="canDelete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTask(t)}
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
            <SheetTitle>Add Task</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <TaskForm
              companyId={companyId}
              projects={projects}
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

      <Sheet open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          {editTask && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Task</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <TaskForm
                  task={{
                    id: editTask.id,
                    reference: editTask.reference,
                    title: editTask.title,
                    description: editTask.description,
                    project_id: editTask.project_id,
                    assigned_to: editTask.assigned_to,
                    priority: editTask.priority,
                    status: editTask.status,
                    due_date: editTask.due_date,
                  }}
                  companyId={companyId}
                  projects={projects}
                  profiles={profiles}
                  onSuccess={() => {
                    router.refresh();
                    setEditTask(null);
                  }}
                  onCancel={() => setEditTask(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteTask}
        onOpenChange={(o) => !o && setDeleteTask(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteTask?.reference}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteTask && handleDelete(deleteTask)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
