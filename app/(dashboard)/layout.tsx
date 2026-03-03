import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppTopbar } from "@/components/shared/app-topbar";
import { RoleProvider } from "@/components/shared/role-provider";
import type { UserRole } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("must_change_password, role")
    .eq("id", data.user.id)
    .single();

  if (profile?.must_change_password) {
    redirect("/auth/change-password");
  }

  const role = (profile?.role as UserRole) ?? "viewer";

  return (
    <RoleProvider role={role}>
      <div className="flex h-screen" suppressHydrationWarning>
        <SidebarProvider>
          <AppSidebar user={data.user} />
          <SidebarInset>
            <AppTopbar user={data.user} />
            <div className="flex-1 p-4 md:p-6">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </RoleProvider>
  );
}
