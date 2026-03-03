import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";

const NOTIFICATION_TYPES = [
  "lease_expiry",
  "overdue_invoice",
  "pdc_due",
  "maintenance",
  "deal",
  "general",
] as const;

type NotificationType = (typeof NOTIFICATION_TYPES)[number];

async function hasExistingUnread(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  title: string,
  message: string
): Promise<boolean> {
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .eq("message", message)
    .eq("is_read", false)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function createNotification(
  supabase: ReturnType<typeof createAdminClient>,
  payload: {
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    link: string | null;
    company_id: string;
  }
  ) {
  // @ts-expect-error - notifications table insert type can infer never when table is not in generated types
  await supabase.from("notifications").insert({
    user_id: payload.user_id,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    link: payload.link,
    company_id: payload.company_id,
  });
}

/**
 * Checks conditions and creates in-app notifications for the user.
 * Call from overview page (server) or API route.
 */
export async function generateNotifications(
  companyId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const in30Str = in30Days.toISOString().slice(0, 10);
  const in7Str = in7Days.toISOString().slice(0, 10);

  const [tenantsRes, invoicesRes, pdcsRes, billsRes] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, full_name, lease_end")
      .eq("company_id", companyId)
      .eq("status", "active")
      .gte("lease_end", todayStr)
      .lte("lease_end", in30Str),
    supabase
      .from("invoices")
      .select("id, reference, total_amount, due_date, status")
      .eq("company_id", companyId)
      .lt("due_date", todayStr)
      .not("status", "in", "('paid','cancelled')"),
    supabase
      .from("pdcs")
      .select("id, cheque_number, bank_name, cheque_date")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .gte("cheque_date", todayStr)
      .lte("cheque_date", in7Str),
    supabase
      .from("bills")
      .select("id, reference, total_amount, due_date, status")
      .eq("company_id", companyId)
      .lt("due_date", todayStr)
      .not("status", "in", "('paid','cancelled')"),
  ]);

  const tenants = (tenantsRes.data ?? []) as { id: string; full_name: string; lease_end: string }[];
  const overdueInvoices = (invoicesRes.data ?? []) as {
    id: string;
    reference: string;
    total_amount: number;
    due_date: string;
    status: string;
  }[];
  const pdcsDue = (pdcsRes.data ?? []) as {
    id: string;
    cheque_number: string;
    bank_name: string;
    cheque_date: string;
  }[];
  const overdueBills = (billsRes.data ?? []) as {
    id: string;
    reference: string;
    total_amount: number;
    due_date: string;
    status: string;
  }[];

  await supabase
    .from("invoices")
    // @ts-expect-error - table update type can infer never
    .update({ status: "overdue", updated_at: new Date().toISOString() })
    .in("id", overdueInvoices.map((i) => i.id));

  await supabase
    .from("bills")
    // @ts-expect-error - table update type can infer never
    .update({ status: "overdue", updated_at: new Date().toISOString() })
    .in("id", overdueBills.map((b) => b.id));

  for (const t of tenants) {
    const title = "Lease Expiring Soon";
    const message = `${t.full_name} lease expires on ${format(new Date(t.lease_end), "dd/MM/yyyy")}`;
    const exists = await hasExistingUnread(supabase, userId, title, message);
    if (!exists) {
      await createNotification(supabase, {
        user_id: userId,
        title,
        message,
        type: "lease_expiry",
        link: "/properties/tenants",
        company_id: companyId,
      });
    }
  }

  for (const inv of overdueInvoices) {
    const title = "Overdue Invoice";
    const amount = Number(inv.total_amount);
    const message = `Invoice ${inv.reference} is overdue - AED ${amount.toFixed(2)}`;
    const exists = await hasExistingUnread(supabase, userId, title, message);
    if (!exists) {
      await createNotification(supabase, {
        user_id: userId,
        title,
        message,
        type: "overdue_invoice",
        link: "/accounts/invoices",
        company_id: companyId,
      });
    }
  }

  for (const p of pdcsDue) {
    const title = "PDC Due Soon";
    const dateStr = format(new Date(p.cheque_date), "dd/MM/yyyy");
    const message = `Cheque ${p.cheque_number} from ${p.bank_name} due on ${dateStr}`;
    const exists = await hasExistingUnread(supabase, userId, title, message);
    if (!exists) {
      await createNotification(supabase, {
        user_id: userId,
        title,
        message,
        type: "pdc_due",
        link: "/accounts/pdc",
        company_id: companyId,
      });
    }
  }

  for (const b of overdueBills) {
    const title = "Overdue Bill";
    const amount = Number(b.total_amount);
    const message = `Bill ${b.reference} is overdue - AED ${amount.toFixed(2)}`;
    const exists = await hasExistingUnread(supabase, userId, title, message);
    if (!exists) {
      await createNotification(supabase, {
        user_id: userId,
        title,
        message,
        type: "overdue_invoice",
        link: "/accounts/bills",
        company_id: companyId,
      });
    }
  }
}
