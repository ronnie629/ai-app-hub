// Simple in-memory rate limiter (per IP)
// For production, consider using Redis-based rate limiting

const requests = new Map<string, { count: number; lastReset: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute per IP

export function rateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const record = requests.get(ip);

  if (!record || now - record.lastReset > WINDOW_MS) {
    requests.set(ip, { count: 1, lastReset: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - record.lastReset) };
  }

  record.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// Clean up stale entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requests) {
    if (now - record.lastReset > WINDOW_MS * 2) {
      requests.delete(ip);
    }
  }
}, 300_000);
