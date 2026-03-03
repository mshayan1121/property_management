import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactsTable } from "@/components/crm/contacts-table";
import { TableSkeleton } from "@/components/shared/table-skeleton";

type ContactsSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  type?: string;
};

async function getContactsData(searchParams: ContactsSearchParams) {
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
      totalCount: 0,
      page: 1,
      pageSize: 10,
    };
  }

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize ?? "10", 10) || 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = (searchParams.search ?? "").trim();
  const typeFilter = searchParams.type ?? "all";

  let query = supabase
    .from("contacts")
    .select("id, full_name, email, phone, type, notes, created_at", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (typeFilter !== "all") {
    query = query.eq("type", typeFilter);
  }

  const { data: contacts, count } = await query.range(from, to);
  const totalCount = count ?? 0;

  return {
    contacts: contacts ?? [],
    companyId,
    totalCount,
    page,
    pageSize,
  };
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<ContactsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
        <p className="text-muted-foreground">
          Manage your contacts and their types
        </p>
      </div>

      <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={10} columns={6} />}>
        <ContactsContent params={params} />
      </Suspense>
    </div>
  );
}

async function ContactsContent({ params }: { params: ContactsSearchParams }) {
  const { contacts, companyId, totalCount, page, pageSize } = await getContactsData(params);

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
    <ContactsTable
      initialContacts={contacts}
      companyId={companyId}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      filterParams={{ search: params.search ?? "", type: params.type ?? "all" }}
    />
  );
}
