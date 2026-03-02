import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ClipboardList, Wrench, Package } from "lucide-react";

const REPORTS = [
  {
    id: "projects",
    title: "Projects Report",
    description:
      "Projects by status and category (bar charts). Table of all projects with completion %.",
    icon: BarChart3,
    href: "/operations/reports/projects",
  },
  {
    id: "tasks",
    title: "Tasks Report",
    description:
      "Tasks by status (donut), overdue count, completion rate trend (line chart).",
    icon: ClipboardList,
    href: "/operations/reports/tasks",
  },
  {
    id: "maintenance",
    title: "Maintenance Report",
    description:
      "Requests by category (bar), average resolution time, cost analysis (estimated vs actual), table of all requests.",
    icon: Wrench,
    href: "/operations/reports/maintenance",
  },
  {
    id: "inventory",
    title: "Inventory Report",
    description:
      "Items by category (donut), low stock list, out of stock list.",
    icon: Package,
    href: "/operations/reports/inventory",
  },
] as const;

export default function OperationsReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Operations Reports</h2>
        <p className="text-muted-foreground">
          Projects, tasks, maintenance, and inventory analytics
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
