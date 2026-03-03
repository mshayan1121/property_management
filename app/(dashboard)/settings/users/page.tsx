import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsersForAdminPage } from "./actions";
import { UsersTableClient } from "./users-table-client";

export default async function SettingsUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    redirect("/unauthorized");
  }
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(params.pageSize ?? "10", 10) || 10));
  const { users, totalCount } = await getUsersForAdminPage(page, pageSize);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Users & Roles</h2>
        <p className="text-muted-foreground">
          Manage team members, roles, and send invites
        </p>
      </div>
      <UsersTableClient
        initialUsers={users}
        currentUserId={user.id}
        totalCount={totalCount}
        currentPage={page}
        pageSize={pageSize}
      />
    </div>
  );
}
