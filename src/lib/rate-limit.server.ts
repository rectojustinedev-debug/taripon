// Server-only. Do not import from client code.
//
// A minimal fixed-window rate limiter keyed by an arbitrary string (usually
// `${ip}:${action}`). Good enough for a single Node process. If this app is
// ever deployed across multiple server instances/edge regions, swap the
// `hits` Map for a shared store (Redis, Supabase table, Upstash, etc.) —
// the interface below (`checkRateLimit`) is written so that swap only
// touches this file.

type Bucket = {
  count: number;
  resetAt: number;
};

const hits = new Map<string, Bucket>();

// Periodically drop expired buckets so this doesn't leak memory forever.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of hits) {
    if (bucket.resetAt <= now) hits.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

/**
 * Fixed-window rate limit check. Call this once per request/attempt.
 * @param key Unique identifier for the limited resource, e.g. `login:${ip}`.
 * @param limit Max allowed hits within the window.
 * @param windowMs Window length in milliseconds.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  let bucket = hits.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    hits.set(key, bucket);
  }

  bucket.count += 1;

  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds: Math.max(0, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/** Resets a key immediately — used on successful login to clear failed-attempt counters. */
export function resetRateLimit(key: string): void {
  hits.delete(key);
}

/**
 * Extracts a best-effort client IP from a Request, honoring common
 * reverse-proxy headers. Falls back to a constant so unauthenticated
 * requests without proxy headers still get a (shared) rate limit bucket
 * instead of bypassing limiting entirely.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export class RateLimitError extends Error {
  statusCode = 429;
  retryAfterSeconds: number;
  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Throws RateLimitError if the key has exceeded `limit` hits in `windowMs`. */
export function enforceRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.allowed) {
    throw new RateLimitError(
      `Too many attempts. Try again in ${result.retryAfterSeconds}s.`,
      result.retryAfterSeconds,
    );
  }
  return result;
}
