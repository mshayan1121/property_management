"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermissionGate } from "@/components/shared/permission-gate";
import { formatCurrency } from "@/lib/utils";
import { MoreVertical, Trash2 } from "lucide-react";

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
  onDelete?: (deal: Deal) => void;
  isDragging?: boolean;
}

export function DealCard({
  deal,
  onDealClick,
  onDelete,
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
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs capitalize">
              {deal.type ?? "-"}
            </Badge>
            {!isDragging && onDelete && (
              <PermissionGate permission="canDelete">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(deal);
                      }}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGate>
            )}
          </div>
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
