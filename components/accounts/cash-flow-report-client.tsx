"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface CashFlowReportClientProps {
  from: string;
  to: string;
  trendData: { month: string; cashFlow: number }[];
}

export function CashFlowReportClient({
  from,
  to,
  trendData,
}: CashFlowReportClientProps) {
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
    router.push(`/accounts/reports/cash-flow?${params.toString()}`);
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

      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cash flow trend</CardTitle>
            <CardDescription>Last 6 months (AED)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <LineChart
                  data={trendData}
                  margin={{ left: 20, right: 20, top: 10, bottom: 60 }}
                >
                  <XAxis
                    dataKey="month"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    width={50}
                  />
                  <Line
                    type="monotone"
                    dataKey="cashFlow"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Net cash flow"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
