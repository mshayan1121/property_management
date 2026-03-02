import { createClient } from "@/lib/supabase/server";
import { generateNotifications } from "@/lib/notifications";
import { checkAndUpdateOverdue } from "@/lib/overdue-check";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  const companyId = profile?.company_id;
  if (!companyId) {
    return NextResponse.json(
      { error: "No company assigned" },
      { status: 400 }
    );
  }
  await checkAndUpdateOverdue(companyId);
  await generateNotifications(companyId, user.id);
  return NextResponse.json({ ok: true });
}
