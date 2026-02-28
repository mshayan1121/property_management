"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface DealsChartViewProps {
  dealsByStage: { name: string; value: number }[];
  dealValueByMonth: { month: string; value: number }[];
  saleVsRental: { name: string; value: number }[];
}

export function DealsChartView({
  dealsByStage,
  dealValueByMonth,
  saleVsRental,
}: DealsChartViewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Deals by Stage</CardTitle>
          <CardDescription>Pipeline distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {dealsByStage.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No deals yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsByStage} margin={{ left: 20, right: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deal Value by Month</CardTitle>
          <CardDescription>Total value (AED) per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {dealValueByMonth.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No deals yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealValueByMonth} margin={{ left: 20, right: 20 }}>
                  <XAxis
                    dataKey="month"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickFormatter={(v) => `AED ${(v / 1000).toFixed(0)}k`}
                  />
                  <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sale vs Rental Split</CardTitle>
          <CardDescription>Deal count by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {saleVsRental.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No deals yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={saleVsRental}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {saleVsRental.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
