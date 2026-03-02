import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, TrendingUp } from "lucide-react";

const REPORTS = [
  {
    id: "portfolio-overview",
    title: "Portfolio Overview",
    description: "Total properties, units, occupancy rate, total monthly revenue. Bar chart: revenue by property. Table: all properties with key metrics.",
    icon: BarChart3,
  },
  {
    id: "monthly-contracts",
    title: "Monthly Contract Reports",
    description: "Contracts signed per month (bar chart). Table: contracts grouped by month.",
    icon: FileText,
  },
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Total revenue, collected, outstanding. Line chart: revenue trend over 12 months. Breakdown by property.",
    icon: TrendingUp,
  },
  {
    id: "vacancy-loss",
    title: "Vacancy Loss Report",
    description: "Vacant units count and lost revenue calculation. Table: vacant units with potential rent amount.",
    icon: BarChart3,
  },
  {
    id: "lease-expiry",
    title: "Lease Expiry Report",
    description: "Leases expiring in next 30, 60, 90 days. Table: tenants with expiry dates highlighted.",
    icon: FileText,
  },
  {
    id: "rent-collection",
    title: "Rent Collection Report",
    description: "Paid vs unpaid invoices for current month. Collection rate %. Table: tenants with payment status.",
    icon: TrendingUp,
  },
  {
    id: "property-performance",
    title: "Property Performance Report",
    description: "Occupancy rate per property. Revenue per property. Bar chart comparison.",
    icon: BarChart3,
  },
  {
    id: "occupancy-rate",
    title: "Occupancy Rate Report",
    description: "Overall occupancy trend over 12 months (line chart). Table: occupancy by property per month.",
    icon: TrendingUp,
  },
  {
    id: "portfolio-summary",
    title: "Portfolio Summary",
    description: "High level summary of entire portfolio. All key metrics in one view.",
    icon: BarChart3,
  },
] as const;

export default function PropertyReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Property Reports</h2>
        <p className="text-muted-foreground">View and export property management reports</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="size-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </div>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/properties/reports/${report.id}`}>View Report</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
