import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactsTable } from "@/components/crm/contacts-table";

async function getContactsData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      contacts: [] as {
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        type: string | null;
        notes: string | null;
        created_at: string;
      }[],
      companyId: "",
    };
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, email, phone, type, notes, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return {
    contacts: contacts ?? [],
    companyId,
  };
}

export default async function ContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
        <p className="text-muted-foreground">
          Manage your contacts and their types
        </p>
      </div>

      <Suspense fallback={<ContactsTableSkeleton />}>
        <ContactsContent />
      </Suspense>
    </div>
  );
}

async function ContactsContent() {
  const { contacts, companyId } = await getContactsData();

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage contacts.
        </p>
      </div>
    );
  }

  return (
    <ContactsTable initialContacts={contacts} companyId={companyId} />
  );
}

function ContactsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
