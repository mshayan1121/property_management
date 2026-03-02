import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/lib/roles";
import { hasPermission } from "@/lib/roles";

const ROUTE_ROLE_MAP: { path: string; permission: "canAccessSettings" | "canAccessCRM" | "canAccessProperties" | "canAccessAccounts" | "canAccessOperations" }[] = [
  { path: "/settings", permission: "canAccessSettings" },
  { path: "/accounts", permission: "canAccessAccounts" },
  { path: "/properties", permission: "canAccessProperties" },
  { path: "/operations", permission: "canAccessOperations" },
  { path: "/crm", permission: "canAccessCRM" },
];

function pathRequiresRole(pathname: string): UserRole[] | null {
  if (pathname === "/" || pathname === "/overview" || pathname.startsWith("/unauthorized")) {
    return null;
  }
  for (const { path, permission } of ROUTE_ROLE_MAP) {
    if (pathname.startsWith(path)) {
      const allowed: UserRole[] = [];
      const roles: UserRole[] = ["admin", "manager", "agent", "viewer"];
      for (const r of roles) {
        if (hasPermission(r, permission)) allowed.push(r);
      }
      return allowed;
    }
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/forgot-password");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/overview") ||
    request.nextUrl.pathname.startsWith("/crm") ||
    request.nextUrl.pathname.startsWith("/properties") ||
    request.nextUrl.pathname.startsWith("/accounts") ||
    request.nextUrl.pathname.startsWith("/hr") ||
    request.nextUrl.pathname.startsWith("/operations") ||
    request.nextUrl.pathname.startsWith("/settings") ||
    request.nextUrl.pathname.startsWith("/unauthorized");

  if (!user && (isDashboardRoute || request.nextUrl.pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isChangePasswordRoute = request.nextUrl.pathname.startsWith("/auth/change-password");
  if (user && (isAuthRoute || request.nextUrl.pathname === "/") && !isChangePasswordRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/overview";
    return NextResponse.redirect(url);
  }

  if (user) {
    const allowedRoles = pathRequiresRole(request.nextUrl.pathname);
    if (allowedRoles) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const role = (profile?.role as UserRole) ?? "viewer";
      if (!allowedRoles.includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
