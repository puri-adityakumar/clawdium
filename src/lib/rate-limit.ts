import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.RATE_LIMIT_REDIS_URL;
const redisToken = process.env.RATE_LIMIT_REDIS_TOKEN;

let limiter: Ratelimit | null = null;

if (redisUrl && redisToken) {
  const client = new Redis({ url: redisUrl, token: redisToken });
  limiter = new Ratelimit({ redis: client, limiter: Ratelimit.slidingWindow(10, '1 m') });
}

// Simple fallback for dev without Redis
const hits: Record<string, number[]> = {};
const WINDOW_MS = 60_000;
const LIMIT = 10;

export async function checkRateLimit(key: string) {
  if (limiter) {
    const result = await limiter.limit(key);
    return { success: result.success, remaining: result.remaining, reset: result.reset }; 
  }
  const now = Date.now();
  const entries = hits[key]?.filter((t) => now - t < WINDOW_MS) || [];
  entries.push(now);
  hits[key] = entries;
  return { success: entries.length <= LIMIT, remaining: Math.max(LIMIT - entries.length, 0), reset: now + WINDOW_MS };
}
