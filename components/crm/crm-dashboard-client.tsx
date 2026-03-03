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

interface CrmDashboardClientProps {
  leadsBySource: { name: string; value: number }[];
  dealsByStage: { name: string; value: number }[];
}

export function CrmDashboardClient({
  leadsBySource,
  dealsByStage,
}: CrmDashboardClientProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Leads by Source</CardTitle>
          <CardDescription>Distribution of lead sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
            {leadsBySource.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No leads yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <PieChart>
                  <Pie
                    data={leadsBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {leadsBySource.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Deals by Stage</CardTitle>
          <CardDescription>Pipeline distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
            {dealsByStage.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No deals yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <BarChart data={dealsByStage} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    width={100}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--chart-1)"
                    radius={[0, 4, 4, 0]}
                    label={{ position: "right" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
