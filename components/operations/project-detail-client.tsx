"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TaskForm } from "./task-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { parseISO, isBefore } from "date-fns";
import { PermissionGate } from "@/components/shared/permission-gate";

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
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
}

interface ProjectDetailClientProps {
  projectId: string;
  initialTasks: TaskRow[];
  companyId: string;
  profiles: { id: string; full_name: string }[];
}

export function ProjectDetailClient({
  projectId,
  initialTasks,
  companyId,
  profiles,
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskRow | null>(null);
  const [deleteTask, setDeleteTask] = useState<TaskRow | null>(null);

  const tasks = initialTasks.filter((t) => !deletedIds.has(t.id));
  const today = new Date().toISOString().slice(0, 10);

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

  function isOverdue(dueDate: string | null, status: string): boolean {
    if (!dueDate || status === "completed" || status === "cancelled")
      return false;
    return isBefore(parseISO(dueDate), new Date());
  }

  return (
    <>
      <Card className="rounded-lg border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <PermissionGate permission="canCreate">
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add task
            </Button>
          </PermissionGate>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground text-sm">No tasks yet</p>
              <PermissionGate permission="canCreate">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add task
                </Button>
              </PermissionGate>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <Link
                        href="/operations/tasks"
                        className="hover:underline"
                      >
                        {t.reference}
                      </Link>
                    </TableCell>
                    <TableCell>{t.title}</TableCell>
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
                    <TableCell className="text-muted-foreground">
                      {t.assigned_name ?? "—"}
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
        </CardContent>
      </Card>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Add task</SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-6 pt-0">
            <TaskForm
              companyId={companyId}
              projectId={projectId}
              projects={[]}
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
                <SheetTitle>Edit task</SheetTitle>
              </SheetHeader>
              <div className="mt-6 p-6 pt-0">
                <TaskForm
                  task={{
                    id: editTask.id,
                    reference: editTask.reference,
                    title: editTask.title,
                    description: null,
                    project_id: projectId,
                    assigned_to: editTask.assigned_to,
                    priority: editTask.priority,
                    status: editTask.status,
                    due_date: editTask.due_date,
                  }}
                  companyId={companyId}
                  projectId={projectId}
                  projects={[]}
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
