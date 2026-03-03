import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function OperationsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <TableSkeleton rows={10} columns={6} />
    </div>
  );
}
