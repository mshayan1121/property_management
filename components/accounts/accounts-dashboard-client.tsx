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

interface AccountsDashboardClientProps {
  invoicesByStatus: { name: string; value: number }[];
  billsByStatus: { name: string; value: number }[];
  revenueVsExpenses?: { month: string; revenue: number; expenses: number }[];
}

export function AccountsDashboardClient({
  invoicesByStatus,
  billsByStatus,
  revenueVsExpenses = [],
}: AccountsDashboardClientProps) {
  const hasDonuts =
    invoicesByStatus.some((d) => d.value > 0) ||
    billsByStatus.some((d) => d.value > 0);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoices by Status</CardTitle>
            <CardDescription>Draft, sent, paid, overdue, cancelled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
              {!hasDonuts || invoicesByStatus.every((d) => d.value === 0) ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No invoices yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={invoicesByStatus}
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
                      {invoicesByStatus.map((_, index) => (
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
            <CardTitle>Bills by Status</CardTitle>
            <CardDescription>Pending, paid, overdue, cancelled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
              {!hasDonuts || billsByStatus.every((d) => d.value === 0) ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No bills yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={billsByStatus}
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
                      {billsByStatus.map((_, index) => (
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

      {revenueVsExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Last 6 months (AED)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <BarChart
                  data={revenueVsExpenses}
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
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    name="Revenue"
                  />
                  <Bar
                    dataKey="expenses"
                    fill="var(--chart-2)"
                    radius={[4, 4, 0, 0]}
                    name="Expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
