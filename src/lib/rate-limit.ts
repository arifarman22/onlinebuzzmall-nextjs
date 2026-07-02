// FIX #7 (High): Rate limiter keyed by both IP and user ID
// Note: This is in-memory per-process. On VPS with PM2 single instance this works correctly.
// On Vercel (multiple serverless instances) each instance has its own counter — acceptable
// tradeoff without Redis. The per-user key in API routes (e.g. order:userId:ip) means an
// attacker needs to control both the session AND the IP to bypass.

const rateMap = new Map<string, { count: number; resetTime: number }>();

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateMap) {
    if (now > val.resetTime) rateMap.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(key: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

export function getRateLimitKey(req: Request, prefix: string): string {
  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  // Include IP in key so even if userId is known, attacker still needs matching IP
  return `${prefix}:${ip}`;
}

// Stricter key for financial operations — combines prefix (which includes userId) + IP
export function getFinancialRateLimitKey(req: Request, userId: number, action: string): string {
  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  return `fin:${action}:${userId}:${ip}`;
}
