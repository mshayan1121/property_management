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

interface PropertiesDashboardClientProps {
  propertiesByStatus: { name: string; value: number }[];
  occupancyByProperty: { name: string; occupied: number; total: number }[];
}

export function PropertiesDashboardClient({
  propertiesByStatus,
  occupancyByProperty,
}: PropertiesDashboardClientProps) {
  const barData = occupancyByProperty.map((x) => ({
    name: x.name,
    occupied: x.occupied,
    total: x.total,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Properties by Status</CardTitle>
          <CardDescription>Active vs inactive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
            {propertiesByStatus.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No properties yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <PieChart>
                  <Pie
                    data={propertiesByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {propertiesByStatus.map((_, index) => (
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
          <CardTitle>Occupancy by Property</CardTitle>
          <CardDescription>Top 5 properties by occupied units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
            {barData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No units yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <BarChart data={barData} margin={{ left: 20, right: 20, top: 10, bottom: 60 }}>
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} width={30} />
                  <Bar
                    dataKey="occupied"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    name="Occupied"
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
