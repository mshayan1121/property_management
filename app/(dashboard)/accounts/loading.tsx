import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function AccountsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>
      <TableSkeleton rows={10} columns={6} />
    </div>
  );
}
