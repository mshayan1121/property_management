"use client";

import { useDroppable } from "@dnd-kit/core";
import { DealCard } from "./deal-card";

interface Deal {
  id: string;
  reference: string | null;
  type: string | null;
  stage: string | null;
  value: number;
  payment_type: string | null;
  contact_name: string | null;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export function KanbanColumn({
  id,
  title,
  deals,
  onDealClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[280px] flex-col rounded-lg border bg-muted/30 p-3 transition-colors ${
        isOver ? "border-primary/50 bg-primary/5" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <span className="text-muted-foreground rounded-full bg-muted px-2 py-0.5 text-xs">
          {deals.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onDealClick={onDealClick}
          />
        ))}
      </div>
    </div>
  );
}
