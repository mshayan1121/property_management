"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface InventoryReportClientProps {
  byCategory: { name: string; value: number }[];
}

export function InventoryReportClient({
  byCategory,
}: InventoryReportClientProps) {
  const hasData = byCategory.some((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items by category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {!hasData ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No inventory items
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
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
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
