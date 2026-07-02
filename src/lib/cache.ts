import { unstable_cache, revalidateTag } from 'next/cache';

/**
 * Wraps a fetcher with Next.js Data Cache (persists across cold starts).
 * @param key - Unique cache key (also used as tag for invalidation)
 * @param ttlSeconds - Revalidation interval in seconds
 * @param fetcher - Async function to fetch data
 */
export function cached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  return unstable_cache(fetcher, [key], { revalidate: ttlSeconds, tags: [key] })();
}

/**
 * Invalidate a specific cache tag. Call from a Server Action or Route Handler.
 */
export function invalidateCache(keyOrPrefix: string) {
  const tag = keyOrPrefix.endsWith('*') ? keyOrPrefix.slice(0, -1) : keyOrPrefix;
  revalidateTag(tag, 'max');
}
