"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OutstandingReportClientProps {
  typeFilter: string;
  ageFilter: string;
}

export function OutstandingReportClient({
  typeFilter,
  ageFilter,
}: OutstandingReportClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const q = params.toString();
    router.push(q ? `/accounts/reports/outstanding?${q}` : "/accounts/reports/outstanding");
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select
        value={typeFilter}
        onValueChange={(v) => setFilter("type", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="rent">Rent</SelectItem>
          <SelectItem value="sale">Sale</SelectItem>
          <SelectItem value="service">Service</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={ageFilter}
        onValueChange={(v) => setFilter("age", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Age" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All ages</SelectItem>
          <SelectItem value="30">0–30 days overdue</SelectItem>
          <SelectItem value="60">31–60 days overdue</SelectItem>
          <SelectItem value="90">61+ days overdue</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
