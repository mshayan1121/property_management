"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Deal {
  id: string;
  reference: string | null;
  contact_name: string | null;
  type: string | null;
  stage: string | null;
  value: number;
  created_at: string;
}

interface MonthGroup {
  month: string;
  year: number;
  deals: Deal[];
}

interface DealsTimelineViewProps {
  deals: Deal[];
}

export function DealsTimelineView({ deals }: DealsTimelineViewProps) {
  const router = useRouter();

  const grouped = deals.reduce<MonthGroup[]>((acc, deal) => {
    const d = new Date(deal.created_at);
    const monthKey = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const year = d.getFullYear();
    let group = acc.find((g) => g.month === monthKey);
    if (!group) {
      group = { month: monthKey, year, deals: [] };
      acc.push(group);
    }
    group.deals.push(deal);
    return acc;
  }, []);

  grouped.sort((a, b) => b.year - a.year || 0);

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">No deals yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div key={group.month}>
          <h3 className="mb-4 text-lg font-semibold capitalize">
            {group.month}
          </h3>
          <div className="space-y-3">
            {group.deals
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
              .map((deal) => (
                <Card
                  key={deal.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/crm/deals/${deal.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{deal.reference ?? "-"}</p>
                        <p className="text-muted-foreground text-sm">
                          {deal.contact_name ?? "No contact"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {deal.type ?? "-"}
                      </Badge>
                      <span className="text-muted-foreground text-sm capitalize">
                        {(deal.stage ?? "").replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(deal.value)}</p>
                      <p className="text-muted-foreground text-sm">
                        {formatDate(deal.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
