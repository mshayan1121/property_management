"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Deal {
  id: string;
  reference: string | null;
  type: string | null;
  stage: string | null;
  value: number;
  payment_type: string | null;
  contact_name: string | null;
}

interface DealCardProps {
  deal: Deal;
  onDealClick?: (deal: Deal) => void;
  isDragging?: boolean;
}

export function DealCard({
  deal,
  onDealClick,
  isDragging = false,
}: DealCardProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: deal.id,
  });

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab touch-none active:cursor-grabbing ${
        isDragging ? "opacity-90 shadow-lg" : ""
      }`}
      onClick={() => onDealClick?.(deal)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm">
            {deal.reference ?? "—"}
          </span>
          <Badge variant="secondary" className="text-xs capitalize">
            {deal.type ?? "-"}
          </Badge>
        </div>
        <p className="mt-1 font-semibold text-primary">
          {formatCurrency(deal.value)}
        </p>
        <p className="text-muted-foreground text-xs">
          {deal.contact_name ?? "No contact"}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs capitalize">
          {deal.payment_type ?? "-"}
        </p>
      </CardContent>
    </Card>
  );
}
