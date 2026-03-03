"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { UserWithProfile } from "./actions";
import {
  updateUserRole,
  setUserStatus,
  inviteUser,
} from "./actions";
import type { ProfileRole } from "@/lib/types/supabase";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

const ROLES: ProfileRole[] = ["admin", "manager", "agent", "viewer"];

const inviteSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["admin", "manager", "agent", "viewer"]),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface UsersTableClientProps {
  initialUsers: UserWithProfile[];
  currentUserId: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export function UsersTableClient({
  initialUsers,
  currentUserId,
  totalCount,
  currentPage,
  pageSize,
}: UsersTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState(initialUsers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleChangePending, setRoleChangePending] = useState<string | null>(null);
  const [statusChangePending, setStatusChangePending] = useState<string | null>(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{
    id: string;
    name: string;
    newRole: ProfileRole;
  } | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<UserWithProfile | null>(null);

  const inviteForm = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", fullName: "", role: "agent" },
  });

  async function handleRoleChange(profileId: string, newRole: ProfileRole) {
    setConfirmRoleChange(null);
    setRoleChangePending(profileId);
    const result = await updateUserRole(profileId, newRole);
    setRoleChangePending(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === profileId ? { ...u, role: newRole } : u))
    );
    toast.success("Role updated");
    router.refresh();
  }

  async function handleDeactivate(user: UserWithProfile) {
    setConfirmDeactivate(null);
    setStatusChangePending(user.id);
    const result = await setUserStatus(user.id, "inactive");
    setStatusChangePending(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: "inactive" } : u))
    );
    toast.success("User deactivated");
    router.refresh();
  }

  async function handleReactivate(user: UserWithProfile) {
    setStatusChangePending(user.id);
    const result = await setUserStatus(user.id, "active");
    setStatusChangePending(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: "active" } : u))
    );
    toast.success("User reactivated");
    router.refresh();
  }

  async function onInviteSubmit(data: InviteForm) {
    const result = await inviteUser(data.email, data.fullName, data.role);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.defaultPassword
        ? `User created. Default password: ${result.defaultPassword}`
        : "User created."
    );
    inviteForm.reset();
    setInviteOpen(false);
    router.refresh();
  }

  function buildUsersUrl(nextPage: number, nextPageSize: number): string {
    const sp = new URLSearchParams();
    if (nextPage > 1) sp.set("page", String(nextPage));
    if (nextPageSize !== 10) sp.set("pageSize", String(nextPageSize));
    const q = sp.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 size-4" />
          Invite user
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userRow) => (
              <TableRow key={userRow.id}>
                <TableCell className="font-medium">{userRow.full_name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {userRow.email ?? "—"}
                </TableCell>
                <TableCell>
                  {userRow.id === currentUserId ? (
                    <Badge variant="secondary" className="capitalize">
                      {userRow.role}
                    </Badge>
                  ) : (
                    <Select
                      value={userRow.role}
                      onValueChange={(value) => {
                        const newRole = value as ProfileRole;
                        setConfirmRoleChange({
                          id: userRow.id,
                          name: userRow.full_name,
                          newRole,
                        });
                      }}
                      disabled={!!roleChangePending}
                    >
                      <SelectTrigger className="w-[120px]" suppressHydrationWarning>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(userRow.created_at), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={userRow.status === "active" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {userRow.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {userRow.id === currentUserId ? (
                    <span className="text-muted-foreground text-sm">You</span>
                  ) : userRow.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!statusChangePending}
                      onClick={() => setConfirmDeactivate(userRow)}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!statusChangePending}
                      onClick={() => handleReactivate(userRow)}
                    >
                      Reactivate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 && (
        <DataTablePagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(page) => router.push(buildUsersUrl(page, pageSize))}
          onPageSizeChange={(size) => router.push(buildUsersUrl(1, size))}
        />
      )}

      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Invite team member</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={inviteForm.handleSubmit(onInviteSubmit)}
            className="mt-6 p-6 pt-0"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  {...inviteForm.register("email")}
                />
                {inviteForm.formState.errors.email && (
                  <p className="text-destructive text-sm">
                    {inviteForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-fullName">Full name</Label>
                <Input
                  id="invite-fullName"
                  {...inviteForm.register("fullName")}
                />
                {inviteForm.formState.errors.fullName && (
                  <p className="text-destructive text-sm">
                    {inviteForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteForm.watch("role")}
                  onValueChange={(v) => inviteForm.setValue("role", v as ProfileRole)}
                >
                  <SelectTrigger id="invite-role" suppressHydrationWarning>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteForm.formState.isSubmitting}>
                {inviteForm.formState.isSubmitting ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!confirmRoleChange}
        onOpenChange={(o) => !o && setConfirmRoleChange(null)}
      >
        <AlertDialogContent suppressHydrationWarning>
          <AlertDialogHeader>
            <AlertDialogTitle>Change role</AlertDialogTitle>
            <AlertDialogDescription>
              Change {confirmRoleChange?.name}&apos;s role to{" "}
              {confirmRoleChange?.newRole}? They will get the permissions for
              that role immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmRoleChange &&
                handleRoleChange(
                  confirmRoleChange.id,
                  confirmRoleChange.newRole
                )
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmDeactivate}
        onOpenChange={(o) => !o && setConfirmDeactivate(null)}
      >
        <AlertDialogContent suppressHydrationWarning>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate user</AlertDialogTitle>
            <AlertDialogDescription>
              Deactivate {confirmDeactivate?.full_name}? They will no longer be
              able to sign in until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                confirmDeactivate && handleDeactivate(confirmDeactivate)
              }
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
