import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsersForAdmin } from "./actions";
import { UsersTableClient } from "./users-table-client";

export default async function SettingsUsersPage() {
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
  const users = await getUsersForAdmin();
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
      />
    </div>
  );
}
