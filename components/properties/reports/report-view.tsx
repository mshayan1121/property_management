"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReportType } from "@/app/(dashboard)/properties/reports/[type]/page";

interface ReportViewProps {
  type: ReportType;
  data: unknown;
}

export function ReportView({ type, data }: ReportViewProps) {
  if (!data) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
        No data for this report.
      </div>
    );
  }

  const d = data as Record<string, unknown>;

  if (type === "portfolio-overview") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{d.totalProperties as number}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{d.totalUnits as number}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(d.occupancyRate as number)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(d.totalMonthlyRevenue as number)}</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Property</CardTitle>
            <CardDescription>Monthly rent revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {(d.revenueByProperty as { name: string; value: number }[])?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.revenueByProperty as { name: string; value: number }[]} margin={{ left: 20, right: 20, bottom: 60 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${v}`} />
                    <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Revenue (AED)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No revenue data</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
            <CardDescription>Key metrics per property</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Occupancy %</TableHead>
                  <TableHead>Revenue (AED)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(d.propertyMetrics as { name: string; type: string; totalUnits: number; occupied: number; occupancyPct: number; revenue: number }[])?.map((p: { name: string; type: string; totalUnits: number; occupied: number; occupancyPct: number; revenue: number }) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{(p.type ?? "-").charAt(0).toUpperCase() + (p.type ?? "").slice(1)}</TableCell>
                    <TableCell>{p.totalUnits}</TableCell>
                    <TableCell>{p.occupied}</TableCell>
                    <TableCell>{p.occupancyPct}%</TableCell>
                    <TableCell>{formatCurrency(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "portfolio-summary") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{d.totalProperties as number}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{d.totalUnits as number}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(d.occupancyRate as number)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(d.totalMonthlyRevenue as number)}</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Property metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Total units</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Vacant</TableHead>
                  <TableHead>Occupancy %</TableHead>
                  <TableHead>Revenue (AED)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(d.propertyMetrics as { name: string; totalUnits: number; occupied: number; occupancyPct: number; revenue: number }[])?.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.totalUnits}</TableCell>
                    <TableCell>{p.occupied}</TableCell>
                    <TableCell>{p.totalUnits - p.occupied}</TableCell>
                    <TableCell>{p.occupancyPct}%</TableCell>
                    <TableCell>{formatCurrency(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "property-performance") {
    const metrics = d.propertyMetrics as { name: string; totalUnits: number; occupied: number; occupancyPct: number; revenue: number }[];
    const chartData = d.revenueByProperty as { name: string; value: number }[];
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: 20, right: 20, bottom: 60 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Occupancy & revenue per property</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Occupancy %</TableHead>
                  <TableHead>Revenue (AED)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.occupancyPct}%</TableCell>
                    <TableCell>{formatCurrency(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "revenue") {
    const chartData = d.revenueByProperty as { name: string; value: number }[];
    const metrics = d.propertyMetrics as { name: string; revenue: number }[];
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Total monthly revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(d.totalRevenue as number)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: 20, right: 20, bottom: 60 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Breakdown by property</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Revenue (AED)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{formatCurrency(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "vacancy-loss") {
    const vacantUnits = d.vacantUnits as { id: string; unit_number: string; propertyName: string; rent_amount: number }[];
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vacant units</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{d.vacantCount as number}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Potential monthly loss (AED)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(d.vacancyLoss as number)}</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Vacant units</CardTitle>
            <CardDescription>Potential rent amount per unit</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Potential rent (AED)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vacantUnits?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No vacant units</TableCell>
                  </TableRow>
                ) : (
                  vacantUnits?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.unit_number}</TableCell>
                      <TableCell>{u.propertyName}</TableCell>
                      <TableCell>{formatCurrency(u.rent_amount ?? 0)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "lease-expiry") {
    const in30 = d.in30 as { reference: string; full_name: string; unit_number: string; property_name: string; lease_end: string; daysUntilExpiry: number }[];
    const in60 = d.in60 as { reference: string; full_name: string; unit_number: string; property_name: string; lease_end: string; daysUntilExpiry: number }[];
    const in90 = d.in90 as { reference: string; full_name: string; unit_number: string; property_name: string; lease_end: string; daysUntilExpiry: number }[];
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{in30?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 60 days</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{in60?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 90 days</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{in90?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Tenants – lease expiry</CardTitle>
            <CardDescription>Leases expiring in the next 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit / Property</TableHead>
                  <TableHead>Lease end</TableHead>
                  <TableHead>Days left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((d.all as { reference: string; full_name: string; unit_number: string; property_name: string; lease_end: string; daysUntilExpiry: number }[]) ?? [])
                  .filter((t) => t.daysUntilExpiry >= 0 && t.daysUntilExpiry <= 90)
                  .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
                  .map((t) => (
                    <TableRow key={t.reference}>
                      <TableCell className="font-mono text-muted-foreground">{t.reference}</TableCell>
                      <TableCell className="font-medium">{t.full_name}</TableCell>
                      <TableCell>{t.unit_number} – {t.property_name}</TableCell>
                      <TableCell>{formatDate(t.lease_end)}</TableCell>
                      <TableCell>
                        <span className={t.daysUntilExpiry <= 30 ? "text-orange-600 dark:text-orange-400 font-medium" : ""}>
                          {t.daysUntilExpiry}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "monthly-contracts") {
    const monthlyData = d.monthlyData as { month: string; count: number }[];
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contracts per month</CardTitle>
            <CardDescription>New tenancy contracts (lease start) by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {monthlyData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ left: 20, right: 20, bottom: 40 }}>
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Contracts" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By month</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Contracts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData?.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell>{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "occupancy-rate") {
    const metrics = d.propertyMetrics as { name: string; totalUnits: number; occupied: number; occupancyPct: number }[];
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(d.occupancyRate as number)}%</p>
              <p className="text-muted-foreground text-xs">{(d.occupiedUnits as number)} / {(d.totalUnits as number)} units</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Occupancy by property</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Total units</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Occupancy %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.totalUnits}</TableCell>
                    <TableCell>{p.occupied}</TableCell>
                    <TableCell>{p.occupancyPct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "rent-collection") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rent collection</CardTitle>
          <CardDescription>Paid vs unpaid for current month</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{(d.message as string) ?? "This report will use invoice data from Phase 4 (Accounts & Finance)."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
      Unknown report type.
    </div>
  );
}
