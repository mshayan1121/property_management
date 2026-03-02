"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VatReportClientProps {
  from: string;
  to: string;
}

export function VatReportClient({ from, to }: VatReportClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fromVal = (form.elements.namedItem("from") as HTMLInputElement).value;
    const toVal = (form.elements.namedItem("to") as HTMLInputElement).value;
    const params = new URLSearchParams(searchParams);
    params.set("from", fromVal);
    params.set("to", toVal);
    router.push(`/accounts/reports/vat?${params.toString()}`);
  }

  return (
    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="from">From</Label>
        <Input id="from" name="from" type="date" defaultValue={from} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="to">To</Label>
        <Input id="to" name="to" type="date" defaultValue={to} />
      </div>
      <Button type="submit">Apply</Button>
    </form>
  );
}
