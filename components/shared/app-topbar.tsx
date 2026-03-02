"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/shared/notification-bell";
import { GlobalSearch } from "@/components/shared/global-search";

const PATH_TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/crm/leads": "Leads",
  "/crm/deals": "Deals",
  "/crm/contacts": "Contacts",
  "/crm/contracts": "Contracts",
  "/properties": "Properties",
  "/properties/listings": "Listings",
  "/properties/units": "Units",
  "/properties/tenants": "Tenants",
  "/properties/reports": "Property Reports",
  "/accounts": "Accounts",
  "/accounts/invoices": "Invoices",
  "/accounts/bills": "Bills",
  "/accounts/payments": "Payments",
  "/accounts/pdc": "PDC",
  "/accounts/vendors": "Vendors",
  "/accounts/reports": "Reports",
  "/accounts/reports/profit-loss": "P&L Statement",
  "/accounts/reports/outstanding": "Outstanding Payments",
  "/accounts/reports/vat": "VAT Report",
  "/accounts/reports/cash-flow": "Cash Flow",
  "/hr/employees": "Employees",
  "/hr/attendance": "Attendance",
  "/hr/payroll": "Payroll",
  "/hr/recruitment": "Recruitment",
  "/operations/projects": "Projects",
  "/operations/tasks": "Tasks",
  "/operations/maintenance": "Maintenance",
  "/settings": "Settings",
};

function getTitleFromPath(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return last ? last.charAt(0).toUpperCase() + last.slice(1) : "Dashboard";
}

interface AppTopbarProps {
  user?: {
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  } | null;
}

export function AppTopbar({ user }: AppTopbarProps) {
  const pathname = usePathname();
  const title = getTitleFromPath(pathname);
  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "User";

  return (
    <header className="border-b bg-background flex h-14 shrink-0 items-center gap-2 px-4">
      <SidebarTrigger />
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <GlobalSearch />
        <ThemeToggle />
        <NotificationBell />
        <Avatar className="size-8">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
