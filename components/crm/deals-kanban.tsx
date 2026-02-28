"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DealForm } from "./deal-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";

const STAGES = [
  "qualified",
  "viewed",
  "negotiation",
  "contract_draft",
  "contract_signed",
] as const;

const STAGE_LABELS: Record<string, string> = {
  qualified: "Qualified",
  viewed: "Viewed",
  negotiation: "Negotiation",
  contract_draft: "Contract Draft",
  contract_signed: "Contract Signed",
};

interface Deal {
  id: string;
  reference: string | null;
  type: string | null;
  stage: string | null;
  value: number;
  payment_type: string | null;
  contact_name: string | null;
}

interface DealsKanbanProps {
  initialDeals: Deal[];
  companyId: string;
  leads: { id: string; full_name: string }[];
  contacts: { id: string; full_name: string }[];
  profiles: { id: string; full_name: string }[];
}

export function DealsKanban({
  initialDeals,
  companyId,
  leads,
  contacts,
  profiles,
}: DealsKanbanProps) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const dealId = active.id as string;
      const newStage = over.id as string;

      if (!STAGES.includes(newStage as (typeof STAGES)[number])) return;

      const deal = deals.find((d) => d.id === dealId);
      if (!deal || deal.stage === newStage) return;

      const supabase = createClient();
      const { error } = await supabase
        .from("deals")
        .update({ stage: newStage })
        .eq("id", dealId);

      if (error) {
        toast.error("Failed to update deal stage");
        return;
      }

      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
      );
      toast.success("Deal moved");
      router.refresh();
    },
    [deals, router]
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  const refresh = useCallback(() => {
    router.refresh();
    setAddOpen(false);
  }, [router]);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add Deal
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              id={stage}
              title={STAGE_LABELS[stage]}
              deals={deals.filter((d) => d.stage === stage)}
              onDealClick={(deal) => router.push(`/crm/deals/${deal.id}`)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealCard deal={activeDeal} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Deal</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <DealForm
              companyId={companyId}
              leads={leads}
              contacts={contacts}
              profiles={profiles}
              onSuccess={refresh}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
