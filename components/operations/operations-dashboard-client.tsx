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

interface OperationsDashboardClientProps {
  projectsByStatus: { name: string; value: number }[];
  projectsByCategory: { name: string; value: number }[];
}

export function OperationsDashboardClient({
  projectsByStatus,
  projectsByCategory,
}: OperationsDashboardClientProps) {
  const hasDonut = projectsByStatus.some((d) => d.value > 0);
  const hasBar = projectsByCategory.some((d) => d.value > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Projects by Status</CardTitle>
          <CardDescription>Pending, in progress, completed, cancelled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {!hasDonut ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No projects yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) =>
                      value > 0 ? `${name}: ${value}` : null
                    }
                  >
                    {projectsByStatus.map((_, index) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Projects by Category</CardTitle>
          <CardDescription>Maintenance, renovation, inspection, etc.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {!hasBar ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No projects yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectsByCategory}
                  margin={{ left: 20, right: 20, bottom: 60 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} />
                  <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
