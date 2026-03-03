# Lessons Learned

Documentation of bugs, issues and lessons learned during development so we never repeat them.

---

## RLS Policies

- **NEVER use a subquery that queries the same table inside an RLS policy** — causes infinite recursion.  
  Example: profiles policy that queries profiles table.  
  Fix: use `auth.uid() = id` directly.

- **Always add DELETE policies explicitly** — Supabase does not add them by default.

- **Foreign key constraints block deletes** — always set `ON DELETE SET NULL` or `ON DELETE CASCADE` on FK relationships where parent deletion is expected.

---

## Next.js / React

- **Radix UI components cause hydration errors in Next.js App Router** — add `suppressHydrationWarning` to SidebarProvider and root layout div.

- **Never fetch role client-side on every page** — fetch once server-side in layout.tsx and pass via React Context (RoleProvider pattern).

- **Recharts ResponsiveContainer needs a parent div with minHeight set** — otherwise shows width/height -1 warning.

- **CommandDialog (global search) needs VisuallyHidden DialogTitle and DialogDescription** for accessibility.

- **Never use localStorage or sessionStorage in Next.js artifacts/components.**

---

## Supabase

- **First user created should auto-become admin** — handle this in a database trigger not application code.

- **useRole hook should never cache across renders** when debugging role issues.

- **Supabase region cannot be changed after project creation** — choose the closest region at the start (Dubai users → use Frankfurt eu-central-1).

- **inviteUserByEmail sends magic link with no password** — use admin.createUser with password instead for simpler onboarding flow.

- **must_change_password flag in profiles table** is the correct pattern for forced password change on first login.

---

## Forms & Validation

- **Never use `<SelectItem value="">`** — always use a real value or handle empty state differently.

- **Never use toLocaleDateString()** — always use date-fns `format()` for consistent date formatting.

- **Always use zod + react-hook-form** for form validation.

---

## Security

- **SUPABASE_SERVICE_ROLE_KEY must NEVER appear in client components** — only in server actions and API routes.

- **Always validate file type AND size** before upload.

- **Rate limit auth endpoints** — even a simple in-memory limiter is better than nothing.

- **Audit logs should be append-only** — never add UPDATE or DELETE policies on audit_logs table.

---

## Performance

- **Always use Promise.all() for parallel Supabase queries** on dashboard pages — never sequential awaits.

- **Always add database indexes** on company_id, status, created_at, due_date for all major tables.

- **Server-side pagination with .range() and count: 'exact'** is the correct pattern — never load all rows client-side.

- **Use select('column1, column2') not select('*')** where full row is not needed.

---

## UI/UX

- **Always show loading state on form submit buttons** (Loader2 spinner from lucide-react).

- **PermissionGate should render optimistically while role loads** to avoid button flash.

- **Status colours:** green = active/paid, blue = in progress, yellow = pending/warning, red = overdue/urgent, gray = draft.

---

## General

- **Keep PROJECT.md, PROGRESS.md, SCHEMA.md, PHASES.md updated after every phase** — essential for AI context in new chat sessions.

- **Delete test data via Supabase in FK-safe order** before handing app to client.

- **Test delete functionality early** — FK constraints will block deletes if not handled properly.
