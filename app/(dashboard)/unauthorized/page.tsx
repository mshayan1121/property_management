"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          You don&apos;t have permission to access this page
        </h1>
        <p className="text-muted-foreground">
          Your current role: <span className="font-medium capitalize">{role}</span>
        </p>
      </div>
      <Button asChild>
        <Link href="/overview" className="gap-2">
          <ArrowLeft className="size-4" />
          Back to overview
        </Link>
      </Button>
    </div>
  );
}
