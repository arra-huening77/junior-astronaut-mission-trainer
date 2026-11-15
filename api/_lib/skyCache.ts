import type { DonkiObservationSet } from '../../src/engine/sky';

export const SKY_CACHE_TTL_MS = 60 * 60 * 1000;
export const SKY_CACHE_HEADERS =
  'public, s-maxage=3600, stale-while-revalidate=600';

export interface DonkiCacheRecord {
  observations: DonkiObservationSet;
  storedAt: string;
  expiresAt: number;
}

const memoryCache = new Map<string, DonkiCacheRecord>();

export function readDonkiCache(
  key: string,
  now = Date.now(),
): DonkiCacheRecord | undefined {
  const entry = memoryCache.get(key);
  if (!entry) return undefined;
  if (now >= entry.expiresAt) {
    memoryCache.delete(key);
    return undefined;
  }
  return entry;
}

export function writeDonkiCache(
  key: string,
  observations: DonkiObservationSet,
  now = Date.now(),
): DonkiCacheRecord {
  const storedAt = new Date(now).toISOString();
  const record: DonkiCacheRecord = {
    observations,
    storedAt,
    expiresAt: now + SKY_CACHE_TTL_MS,
  };
  memoryCache.set(key, record);
  return record;
}

/** Test-only reset. */
export function clearDonkiCache(): void {
  memoryCache.clear();
}
