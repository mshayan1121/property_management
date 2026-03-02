"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfitLossReportClientProps {
  from: string;
  to: string;
  revenueByType: { name: string; value: number }[];
  expensesByCategory: { name: string; value: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export function ProfitLossReportClient({
  from,
  to,
  revenueByType,
  expensesByCategory,
  totalRevenue,
  totalExpenses,
  netProfit,
  profitMargin,
}: ProfitLossReportClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fromVal = (form.elements.namedItem("from") as HTMLInputElement).value;
    const toVal = (form.elements.namedItem("to") as HTMLInputElement).value;
    const params = new URLSearchParams(searchParams);
    params.set("from", fromVal);
    params.set("to", toVal);
    router.push(`/accounts/reports/profit-loss?${params.toString()}`);
  }

  return (
    <>
      <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>By type (AED)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {revenueByType
              .filter((r) => r.value > 0)
              .map((r) => (
                <div
                  key={r.name}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground capitalize">
                    {r.name}
                  </span>
                  <span>{formatCurrency(r.value)}</span>
                </div>
              ))}
            {revenueByType.every((r) => r.value === 0) && (
              <p className="text-muted-foreground text-sm">No revenue in period</p>
            )}
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total revenue</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>By category (AED)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {expensesByCategory
              .filter((e) => e.value > 0)
              .map((e) => (
                <div
                  key={e.name}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground capitalize">
                    {e.name}
                  </span>
                  <span>{formatCurrency(e.value)}</span>
                </div>
              ))}
            {expensesByCategory.every((e) => e.value === 0) && (
              <p className="text-muted-foreground text-sm">No expenses in period</p>
            )}
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total expenses</span>
              <span>{formatCurrency(totalExpenses)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Net profit/loss (AED)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Net profit / loss</span>
            <span
              className={
                netProfit >= 0 ? "font-medium" : "font-medium text-destructive"
              }
            >
              {formatCurrency(netProfit)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Profit margin</span>
            <span>{profitMargin.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
