import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { VendorsTable } from "@/components/accounts/vendors-table";

async function getVendorsData() {
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
      vendors: [] as {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        category: string | null;
        address: string | null;
        trn: string | null;
        status: string;
        notes: string | null;
      }[],
      companyId: "",
    };
  }

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name, email, phone, category, address, trn, status, notes")
    .eq("company_id", companyId)
    .order("name");

  return {
    vendors: vendors ?? [],
    companyId,
  };
}

export default async function VendorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vendors</h2>
        <p className="text-muted-foreground">
          Manage vendor database and track payments
        </p>
      </div>

      <Suspense fallback={<VendorsTableSkeleton />}>
        <VendorsContent />
      </Suspense>
    </div>
  );
}

async function VendorsContent() {
  const { vendors, companyId } = await getVendorsData();

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You need to be assigned to a company to manage vendors.
        </p>
      </div>
    );
  }

  return <VendorsTable initialVendors={vendors} companyId={companyId} />;
}

function VendorsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
