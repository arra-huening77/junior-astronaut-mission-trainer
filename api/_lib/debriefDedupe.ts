import type { DebriefResponse } from '../../src/engine/contracts';
import type { DebriefRequest } from '../../src/engine/contracts';

const DEDUPE_TTL_MS = 5 * 60 * 1000;

interface DedupeRecord {
  response: DebriefResponse;
  expiresAt: number;
}

const dedupeStore = new Map<string, DedupeRecord>();

export function clearDebriefDedupe(): void {
  dedupeStore.clear();
}

export function fingerprintDebriefRequest(payload: DebriefRequest): string {
  return JSON.stringify(payload);
}

export function readDedupedDebrief(
  fingerprint: string,
  now = Date.now(),
): DebriefResponse | undefined {
  const hit = dedupeStore.get(fingerprint);
  if (!hit) return undefined;
  if (now >= hit.expiresAt) {
    dedupeStore.delete(fingerprint);
    return undefined;
  }
  return hit.response;
}

export function writeDedupedDebrief(
  fingerprint: string,
  response: DebriefResponse,
  now = Date.now(),
): void {
  dedupeStore.set(fingerprint, { response, expiresAt: now + DEDUPE_TTL_MS });
}
