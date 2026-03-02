import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Receipt, Wallet } from "lucide-react";

const REPORTS = [
  {
    id: "profit-loss",
    title: "P&L Statement",
    description:
      "Revenue by type (rental, sales, other), expenses by category, net profit/loss and profit margin %.",
    icon: BarChart3,
    href: "/accounts/reports/profit-loss",
  },
  {
    id: "outstanding",
    title: "Outstanding Payments",
    description:
      "All unpaid and overdue invoices. Total outstanding amount. Filter by type and age (30/60/90+ days).",
    icon: FileText,
    href: "/accounts/reports/outstanding",
  },
  {
    id: "vat",
    title: "VAT Report",
    description:
      "VAT collected from invoices, VAT paid on bills, net VAT payable. Table of all VAT transactions.",
    icon: Receipt,
    href: "/accounts/reports/vat",
  },
  {
    id: "cash-flow",
    title: "Cash Flow Statement",
    description:
      "Money in (payments received), money out (bills paid), net cash flow. Line chart: cash flow trend.",
    icon: Wallet,
    href: "/accounts/reports/cash-flow",
  },
] as const;

export default function AccountsReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Financial Reports</h2>
        <p className="text-muted-foreground">
          View P&L, outstanding payments, VAT, and cash flow
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
                  <Link href={report.href}>View Report</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
