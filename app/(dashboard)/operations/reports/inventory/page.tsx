import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryReportClient } from "@/components/operations/reports/inventory-report-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

async function getInventoryReportData() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const companyId = profile?.company_id;
  if (!companyId) {
    return {
      byCategory: [] as { name: string; value: number }[],
      lowStock: [] as {
        id: string;
        name: string;
        category: string | null;
        quantity: number;
        minimum_quantity: number;
        unit: string;
      }[],
      outOfStock: [] as {
        id: string;
        name: string;
        category: string | null;
        unit: string;
      }[],
    };
  }

  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, name, category, quantity, minimum_quantity, unit, status")
    .eq("company_id", companyId);

  const list = items ?? [];
  const categoryCounts: Record<string, number> = {};
  list.forEach((i) => {
    const cat = i.category ?? "other";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  });

  const byCategory = [
    "furniture",
    "appliance",
    "equipment",
    "supplies",
    "other",
  ].map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: categoryCounts[name] ?? 0,
  }));

  const lowStock = list
    .filter(
      (i) =>
        i.status !== "out_of_stock" &&
        Number(i.quantity) <= Number(i.minimum_quantity)
    )
    .map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      quantity: Number(i.quantity),
      minimum_quantity: Number(i.minimum_quantity),
      unit: i.unit,
    }));

  const outOfStock = list
    .filter((i) => i.status === "out_of_stock")
    .map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      unit: i.unit,
    }));

  return { byCategory, lowStock, outOfStock };
}

export default async function InventoryReportPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/operations/reports">
          <ArrowLeft className="mr-2 size-4" />
          Back to reports
        </Link>
      </Button>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory Report</h2>
        <p className="text-muted-foreground">
          Items by category, low stock, and out of stock
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <InventoryReportContent />
      </Suspense>
    </div>
  );
}

async function InventoryReportContent() {
  const { byCategory, lowStock, outOfStock } =
    await getInventoryReportData();

  return (
    <>
      <InventoryReportClient byCategory={byCategory} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low stock items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium">Name</th>
                      <th className="pb-2 text-left font-medium">Category</th>
                      <th className="pb-2 text-right font-medium">Qty</th>
                      <th className="pb-2 text-right font-medium">Min</th>
                      <th className="pb-2 text-left font-medium">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-muted-foreground"
                        >
                          No low stock items
                        </td>
                      </tr>
                    ) : (
                      lowStock.map((i) => (
                        <tr key={i.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">{i.name}</td>
                          <td className="py-3 capitalize">{i.category ?? "—"}</td>
                          <td className="py-3 text-right">{i.quantity}</td>
                          <td className="py-3 text-right">{i.minimum_quantity}</td>
                          <td className="py-3">{i.unit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Out of stock items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium">Name</th>
                      <th className="pb-2 text-left font-medium">Category</th>
                      <th className="pb-2 text-left font-medium">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outOfStock.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-6 text-center text-muted-foreground"
                        >
                          No out of stock items
                        </td>
                      </tr>
                    ) : (
                      outOfStock.map((i) => (
                        <tr key={i.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">{i.name}</td>
                          <td className="py-3 capitalize">{i.category ?? "—"}</td>
                          <td className="py-3">{i.unit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
