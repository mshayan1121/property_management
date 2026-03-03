import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Updates invoices and bills that are past due_date to status 'overdue'.
 * Returns counts of records updated.
 */
export async function checkAndUpdateOverdue(
  companyId: string
): Promise<{ invoicesUpdated: number; billsUpdated: number }> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: overdueInvoicesData } = await supabase
    .from("invoices")
    .select("id")
    .eq("company_id", companyId)
    .lt("due_date", today)
    .not("status", "in", "('paid','cancelled')");

  const { data: overdueBillsData } = await supabase
    .from("bills")
    .select("id")
    .eq("company_id", companyId)
    .lt("due_date", today)
    .not("status", "in", "('paid','cancelled')");

  const overdueInvoices = (overdueInvoicesData ?? []) as { id: string }[];
  const overdueBills = (overdueBillsData ?? []) as { id: string }[];

  let invoicesUpdated = 0;
  let billsUpdated = 0;

  if (overdueInvoices.length) {
    await supabase
      .from("invoices")
      // @ts-expect-error - admin client table update type can infer never
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .in(
        "id",
        overdueInvoices.map((r) => r.id)
      );
    invoicesUpdated = overdueInvoices.length;
  }

  if (overdueBills.length) {
    await supabase
      .from("bills")
      // @ts-expect-error - admin client table update type can infer never
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .in(
        "id",
        overdueBills.map((r) => r.id)
      );
    billsUpdated = overdueBills.length;
  }

  return { invoicesUpdated, billsUpdated };
}
