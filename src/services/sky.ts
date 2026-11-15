/**
 * Browser adapter for GET /api/sky. No server secrets; validates wire responses client-side.
 */

import { z } from 'zod';
import {
  isCalendarDate,
  isObservationTimestamp,
} from '../engine/observation-time';

import type { SkyResponse } from '../engine/contracts';
import type { FrozenSky, SkyLevel, SkySource } from '../engine/types';

export const SKY_CLIENT_TIMEOUT_MS = 2_000;
export const SKY_CACHE_TTL_MS = 48 * 60 * 60 * 1000;
export const SKY_STORAGE_PREFIX = 'mms.sky.';

const skyLevelSchema = z.union([
  z.literal('calm'),
  z.literal('active'),
  z.literal('stormy'),
]);
const skySourceSchema = z.union([
  z.literal('live'),
  z.literal('cache'),
  z.literal('saved'),
]);

const skyEventSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    observedAt: z.string().refine(isObservationTimestamp),
    sourceUrl: z.string().url(),
    classType: z.string().optional(),
  })
  .strict();

export const skyResponseSchema = z
  .object({
    date: z.string().refine(isCalendarDate),
    level: skyLevelSchema,
    event: skyEventSchema.nullable(),
    source: skySourceSchema,
    fetchedAt: z.string().refine(isObservationTimestamp),
    windowStart: z.string().refine(isCalendarDate).optional(),
    windowEnd: z.string().refine(isCalendarDate).optional(),
  })
  .strict();

export interface DonkiArchiveEntry {
  id: string;
  type: string;
  level: SkyLevel;
  observedAt: string;
  sourceUrl: string;
  classType?: string;
}

export interface DonkiArchiveFile {
  events: DonkiArchiveEntry[];
}

export interface SkyCacheRecord {
  response: SkyResponse;
  storedAt: string;
}

export interface FetchSkyOptions {
  /** Observation query date (YYYY-MM-DD). */
  queryDate: string;
  /** Continue Mission: use frozen snapshot; do not call /api/sky. */
  restoreSnapshot?: FrozenSky;
  /** Dev-only: append ?fail=sky when true (Section 16). */
  simulateApiFailure?: boolean;
  fetchImpl?: typeof fetch;
  now?: number;
}

export interface SkyFetchSuccess {
  ok: true;
  response: SkyResponse;
  snapshot: FrozenSky;
  /** Where the chosen data came from after fallback resolution. */
  resolvedSource: SkySource;
}

export interface SkyFetchFailure {
  ok: false;
  reason: 'unavailable' | 'mission_restored';
}

export type SkyFetchResult = SkyFetchSuccess | SkyFetchFailure;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function snapshotToResponse(
  queryDate: string,
  snapshot: FrozenSky,
): SkyFetchSuccess {
  return {
    ok: true,
    response: {
      date: queryDate,
      level: snapshot.level,
      event: snapshot.eventId
        ? {
            id: snapshot.eventId,
            type: 'FLR',
            observedAt: snapshot.observedAt ?? snapshot.fetchedAt,
            sourceUrl: snapshot.sourceUrl ?? 'https://api.nasa.gov/',
          }
        : null,
      source: snapshot.source,
      fetchedAt: snapshot.fetchedAt,
    },
    snapshot,
    resolvedSource: snapshot.source,
  };
}

let bundledArchive: DonkiArchiveFile = { events: [] };
let missionFrozenSnapshot: FrozenSky | null = null;
let activeFetchGeneration = 0;

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Content loader (Member 3) registers bundled archive entries before first mission fetch. */
export function registerDonkiArchive(archive: DonkiArchiveFile): void {
  bundledArchive = archive;
}

/** Called when a mission run starts so late /api/sky responses cannot replace the frozen snapshot. */
export function freezeMissionSkySnapshot(snapshot: FrozenSky): void {
  missionFrozenSnapshot = snapshot;
}

export function clearMissionSkyFreeze(): void {
  missionFrozenSnapshot = null;
}

/** Test reset. */
export function resetSkyServiceState(): void {
  bundledArchive = { events: [] };
  missionFrozenSnapshot = null;
  activeFetchGeneration = 0;
}

export function skyCacheKey(queryDate: string): string {
  return `${SKY_STORAGE_PREFIX}${queryDate}`;
}

export function parseSkyResponse(raw: unknown): SkyResponse | null {
  const parsed = skyResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function toFrozenSky(response: SkyResponse): FrozenSky {
  return {
    level: response.level,
    source: response.source,
    eventId: response.event?.id,
    observedAt: response.event?.observedAt,
    fetchedAt: response.fetchedAt,
    sourceUrl: response.event?.sourceUrl,
  };
}

function hashQueryDate(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i += 1) {
    hash = (hash * 31 + date.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function pickArchivedResponse(
  queryDate: string,
  now = Date.now(),
): SkyResponse | null {
  if (bundledArchive.events.length === 0) return null;
  const index = hashQueryDate(queryDate) % bundledArchive.events.length;
  const entry = bundledArchive.events[index];
  if (!entry) return null;

  return {
    date: queryDate,
    level: entry.level,
    event: {
      id: entry.id,
      type: entry.type,
      observedAt: entry.observedAt,
      sourceUrl: entry.sourceUrl,
      classType: entry.classType,
    },
    source: 'saved',
    fetchedAt: new Date(now).toISOString(),
  };
}

export function readSkyCache(
  queryDate: string,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): SkyResponse | null {
  if (!storage) return null;

  let raw: string | null;
  try {
    raw = storage.getItem(skyCacheKey(queryDate));
  } catch {
    return null;
  }

  if (!raw) return null;

  let record: unknown;
  try {
    record = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!record || typeof record !== 'object' || Array.isArray(record))
    return null;
  const cached = record as Record<string, unknown>;
  if (
    typeof cached.storedAt !== 'string' ||
    !isObservationTimestamp(cached.storedAt)
  )
    return null;
  const storedAt = Date.parse(cached.storedAt);
  if (storedAt > now || now - storedAt > SKY_CACHE_TTL_MS) {
    try {
      storage.removeItem(skyCacheKey(queryDate));
    } catch {
      /* ignore */
    }
    return null;
  }

  const response = parseSkyResponse(cached.response);
  if (!response || response.date !== queryDate) return null;

  return {
    ...response,
    source: 'cache',
  };
}

export function writeSkyCache(
  response: SkyResponse,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): void {
  if (!storage) return;
  const record: SkyCacheRecord = {
    response,
    storedAt: new Date(now).toISOString(),
  };
  try {
    storage.setItem(skyCacheKey(response.date), JSON.stringify(record));
  } catch {
    /* storage unavailable */
  }
}

async function fetchLiveSky(
  queryDate: string,
  options: {
    simulateApiFailure?: boolean;
    fetchImpl: typeof fetch;
    generation: number;
  },
): Promise<SkyResponse | null> {
  const params = new URLSearchParams({ date: queryDate });
  if (options.simulateApiFailure) params.set('fail', 'sky');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SKY_CLIENT_TIMEOUT_MS);

  try {
    const res = await options.fetchImpl(`/api/sky?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (options.generation !== activeFetchGeneration) return null;

    if (!res.ok) return null;

    const body: unknown = await res.json();
    const parsed = parseSkyResponse(body);
    if (!parsed || parsed.date !== queryDate) return null;

    if (options.generation !== activeFetchGeneration) return null;
    if (missionFrozenSnapshot) return null;

    return parsed;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function resolveWithFallback(
  queryDate: string,
  live: SkyResponse | null,
  storage: StorageLike | null,
  now: number,
): SkyResponse | null {
  if (live) return live;

  const cached = readSkyCache(queryDate, storage, now);
  if (cached) return cached;

  return pickArchivedResponse(queryDate, now);
}

/**
 * Resolves NASA sky input for Plan (Start Mission). Does not block navigation: callers
 * should show UI immediately and await this without locking the shell.
 */
export async function fetchSkyForMission(
  options: FetchSkyOptions,
): Promise<SkyFetchResult> {
  if (!isCalendarDate(options.queryDate))
    return { ok: false, reason: 'unavailable' };
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now();
  const storage = defaultStorage();

  if (options.restoreSnapshot) {
    return snapshotToResponse(options.queryDate, options.restoreSnapshot);
  }

  if (missionFrozenSnapshot) {
    return snapshotToResponse(options.queryDate, missionFrozenSnapshot);
  }

  const generation = (activeFetchGeneration += 1);

  const live = await fetchLiveSky(options.queryDate, {
    simulateApiFailure: options.simulateApiFailure,
    fetchImpl,
    generation,
  });

  if (generation !== activeFetchGeneration) {
    return { ok: false, reason: 'unavailable' };
  }

  if (missionFrozenSnapshot) {
    return snapshotToResponse(options.queryDate, missionFrozenSnapshot);
  }

  const resolved = resolveWithFallback(options.queryDate, live, storage, now);
  if (!resolved) {
    return { ok: false, reason: 'unavailable' };
  }

  if (live) {
    writeSkyCache(live, storage, now);
  }

  const snapshot = toFrozenSky(resolved);
  return {
    ok: true,
    response: resolved,
    snapshot,
    resolvedSource: resolved.source,
  };
}

/**
 * Applies a late live response only if no mission snapshot is frozen yet.
 * Returns false when the update must be discarded.
 */
export function applyLateSkyResponseIfAllowed(response: SkyResponse): boolean {
  if (missionFrozenSnapshot) return false;
  const parsed = parseSkyResponse(response);
  if (!parsed) return false;
  writeSkyCache(parsed);
  freezeMissionSkySnapshot(toFrozenSky(parsed));
  return true;
}
