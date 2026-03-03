"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface PageErrorProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
}

export function PageError({
  title = "Failed to load data",
  message = "Please try refreshing the page",
  showRetry = true,
}: PageErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 px-4 text-center"
      role="alert"
    >
      <AlertCircle className="size-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">{message}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        {showRetry && (
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        )}
        <Button asChild>
          <Link href="/overview">Go to Overview</Link>
        </Button>
      </div>
    </div>
  );
}
