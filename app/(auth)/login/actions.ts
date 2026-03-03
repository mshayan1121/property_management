"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60000; // 1 minute

export async function checkLoginRateLimit(): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const realIp = h.get("x-real-ip");
  const identifier =
    (forwarded?.split(",")[0]?.trim() ?? realIp ?? "unknown").slice(0, 100) ||
    "unknown";
  return checkRateLimit(identifier, MAX_ATTEMPTS, WINDOW_MS);
}
