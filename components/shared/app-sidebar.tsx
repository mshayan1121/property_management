"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Building2,
  Wallet,
  Wrench,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AppSidebarProps {
  user?: {
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  } | null;
}

const navItems = [
  {
    title: "Overview",
    href: "/overview",
    icon: Home,
  },
  {
    title: "CRM",
    icon: Users,
    items: [
      { title: "Dashboard", href: "/crm" },
      { title: "Leads", href: "/crm/leads" },
      { title: "Deals", href: "/crm/deals" },
      { title: "Contacts", href: "/crm/contacts" },
      { title: "Contracts", href: "/crm/contracts" },
    ],
  },
  {
    title: "Properties",
    icon: Building2,
    items: [
      { title: "Dashboard", href: "/properties" },
      { title: "Listings", href: "/properties/listings" },
      { title: "Units", href: "/properties/units" },
      { title: "Tenants", href: "/properties/tenants" },
      { title: "Reports", href: "/properties/reports" },
    ],
  },
  {
    title: "Accounts",
    icon: Wallet,
    items: [
      { title: "Dashboard", href: "/accounts" },
      { title: "Invoices", href: "/accounts/invoices" },
      { title: "Bills", href: "/accounts/bills" },
      { title: "Payments", href: "/accounts/payments" },
      { title: "PDC", href: "/accounts/pdc" },
      { title: "Vendors", href: "/accounts/vendors" },
      { title: "Reports", href: "/accounts/reports" },
    ],
  },
  {
    title: "Operations",
    icon: Wrench,
    items: [
      { title: "Dashboard", href: "/operations" },
      { title: "Projects", href: "/operations/projects" },
      { title: "Tasks", href: "/operations/tasks" },
      { title: "Maintenance", href: "/operations/maintenance" },
      { title: "Work Orders", href: "/operations/work-orders" },
      { title: "Inventory", href: "/operations/inventory" },
      { title: "Amenity Bookings", href: "/operations/amenity-bookings" },
      { title: "Announcements", href: "/operations/announcements" },
      { title: "Reports", href: "/operations/reports" },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "User";

  return (
    <div suppressHydrationWarning>
      <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Jetset Business">
              <Link
                href="/overview"
                className="flex items-center gap-2 transition-[justify-content] duration-200 ease-linear group-data-[collapsible=icon]:justify-center"
              >
                <Building2 className="size-6 shrink-0" />
                <span className="truncate font-semibold text-base group-data-[collapsible=icon]:hidden">
                  Jetset Business
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) =>
                item.items ? (
                  <Collapsible
                    key={item.title}
                    defaultOpen={item.items.some((i) =>
                      pathname.startsWith(i.href)
                    )}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={item.items.some((i) =>
                            pathname.startsWith(i.href)
                          )}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.href}
                              >
                                <Link href={subItem.href}>{subItem.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                    >
                      <Link href={item.href!}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-md">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="rounded-md">
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width]"
              >
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </div>
  );
}
