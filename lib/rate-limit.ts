/**
 * In-memory rate limiter for auth and sensitive endpoints.
 * TODO: Replace with Upstash Redis in production (resets on server restart).
 */

const attempts = new Map<
  string,
  { count: number; resetTime: number }
>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = attempts.get(identifier);

  if (!record || now > record.resetTime) {
    attempts.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxAttempts - record.count };
}
