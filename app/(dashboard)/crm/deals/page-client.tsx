"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, BarChart3, Calendar } from "lucide-react";
import { DealsKanban } from "@/components/crm/deals-kanban";
import { DealsList } from "@/components/crm/deals-list";
import { DealsChartView } from "@/components/crm/deals-chart-view";
import { DealsTimelineView } from "@/components/crm/deals-timeline-view";

interface DealsPageClientProps {
  deals: {
    id: string;
    reference: string | null;
    type: string | null;
    stage: string | null;
    value: number;
    payment_type: string | null;
    contact_name: string | null;
    commission_amount: number;
    assigned_to_name: string | null;
    created_at: string;
  }[];
  companyId: string;
  leads: { id: string; full_name: string }[];
  contacts: { id: string; full_name: string }[];
  profiles: { id: string; full_name: string }[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filterParams: { search: string; type: string; stage: string; assignee: string };
}

export function DealsPageClient({
  deals,
  companyId,
  leads,
  contacts,
  profiles,
  totalCount,
  currentPage,
  pageSize,
  filterParams,
}: DealsPageClientProps) {
  const dealsByStage = useMemo(() => {
    const counts: Record<string, number> = {};
    const order = [
      "qualified",
      "viewed",
      "negotiation",
      "contract_draft",
      "contract_signed",
    ];
    deals.forEach((d) => {
      const s = d.stage ?? "unknown";
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return order
      .filter((s) => (counts[s] ?? 0) > 0)
      .map((s) => ({
        name: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: counts[s] ?? 0,
      }));
  }, [deals]);

  const dealValueByMonth = useMemo(() => {
    const byMonth: Record<string, number> = {};
    deals.forEach((d) => {
      const date = new Date(d.created_at);
      const key = format(date, "MMM yyyy");
      byMonth[key] = (byMonth[key] ?? 0) + d.value;
    });
    return Object.entries(byMonth)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => {
        const dA = new Date(a.month);
        const dB = new Date(b.month);
        return dA.getTime() - dB.getTime();
      });
  }, [deals]);

  const saleVsRental = useMemo(() => {
    const sale = deals.filter((d) => d.type === "sale").length;
    const rental = deals.filter((d) => d.type === "rental").length;
    const result: { name: string; value: number }[] = [];
    if (sale > 0) result.push({ name: "Sale", value: sale });
    if (rental > 0) result.push({ name: "Rental", value: rental });
    return result;
  }, [deals]);

  const kanbanDeals = deals.map((d) => ({
    id: d.id,
    reference: d.reference,
    type: d.type,
    stage: d.stage,
    value: d.value,
    payment_type: d.payment_type,
    contact_name: d.contact_name,
  }));

  const timelineDeals = deals.map((d) => ({
    id: d.id,
    reference: d.reference,
    contact_name: d.contact_name,
    type: d.type,
    stage: d.stage,
    value: d.value,
    created_at: d.created_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Deals</h2>
        <p className="text-muted-foreground">
          Manage your deals across pipeline stages
        </p>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="size-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="size-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="chart" className="gap-2">
            <BarChart3 className="size-4" />
            Chart
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="size-4" />
            Timeline
          </TabsTrigger>
        </TabsList>
        <TabsContent value="kanban">
          <DealsKanban
            initialDeals={kanbanDeals}
            companyId={companyId}
            leads={leads}
            contacts={contacts}
            profiles={profiles}
          />
        </TabsContent>
        <TabsContent value="list">
          <DealsList
            initialDeals={deals}
            companyId={companyId}
            leads={leads}
            contacts={contacts}
            profiles={profiles}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            filterParams={filterParams}
          />
        </TabsContent>
        <TabsContent value="chart">
          <DealsChartView
            dealsByStage={dealsByStage}
            dealValueByMonth={dealValueByMonth}
            saleVsRental={saleVsRental}
          />
        </TabsContent>
        <TabsContent value="timeline">
          <DealsTimelineView deals={timelineDeals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
