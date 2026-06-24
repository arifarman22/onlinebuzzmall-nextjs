
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Get or set cached data.
 * @param key - Cache key
 * @param ttlMs - Time to live in milliseconds
 * @param fetcher - Async function to fetch data if cache miss
 */
export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);

  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  const data = await fetcher();
  cache.set(key, { data, expiresAt: now + ttlMs });

  // Cleanup old entries periodically (every 100 sets)
  if (cache.size > 200) {
    for (const [k, v] of cache) {
      if (v.expiresAt < now) cache.delete(k);
    }
  }

  return data;
}

/**
 * Invalidate a specific cache key or pattern.
 */
export function invalidateCache(keyOrPrefix: string) {
  if (keyOrPrefix.endsWith('*')) {
    const prefix = keyOrPrefix.slice(0, -1);
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  } else {
    cache.delete(keyOrPrefix);
  }
}
