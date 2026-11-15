import type { SkyResponse } from '../../src/engine/contracts';
import type { SkySource } from '../../src/engine/types';
import { buildSkyResponse } from './buildSkyResponse';
import {
  cacheKeyForWindow,
  donkiWindowForQueryDate,
  fetchDonkiObservations,
  parseQueryDate,
} from './donkiClient';
import {
  readDonkiCache,
  writeDonkiCache,
  type DonkiCacheRecord,
} from './skyCache';
import { SkyApiError } from './skyErrors';

export interface SkyGetSuccess {
  ok: true;
  body: SkyResponse;
  cacheHeaders: boolean;
}

export interface SkyGetFailure {
  ok: false;
  status: number;
  body: { error: string; message?: string };
}

export type SkyGetResult = SkyGetSuccess | SkyGetFailure;

function requireNasaApiKey(): string {
  const key = process.env.NASA_API_KEY?.trim();
  if (!key) {
    throw new SkyApiError('config_missing', 503);
  }
  return key;
}

function shouldSimulateSkyFailure(
  query: Record<string, string | string[] | undefined>,
): boolean {
  const fail = query.fail;
  if (fail !== 'sky') return false;
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';
  return env === 'development' || env === 'preview';
}

export async function handleSkyGet(
  query: Record<string, string | string[] | undefined>,
): Promise<SkyGetResult> {
  if (shouldSimulateSkyFailure(query)) {
    return {
      ok: false,
      status: 503,
      body: {
        error: 'sky_unavailable',
        message: 'Development fail switch active',
      },
    };
  }

  let queryDate: string;
  try {
    queryDate = parseQueryDate(query.date);
  } catch (err) {
    if (err instanceof SkyApiError) {
      return {
        ok: false,
        status: err.httpStatus,
        body: { error: err.code, message: err.message },
      };
    }
    throw err;
  }

  const window = donkiWindowForQueryDate(queryDate);
  const cacheKey = cacheKeyForWindow(window);

  const cached: DonkiCacheRecord | undefined = readDonkiCache(cacheKey);
  if (cached) {
    const body = buildSkyResponse(
      queryDate,
      window,
      cached.observations,
      'cache' satisfies SkySource,
      cached.storedAt,
    );
    return { ok: true, body, cacheHeaders: true };
  }

  let apiKey: string;
  try {
    apiKey = requireNasaApiKey();
  } catch (err) {
    if (err instanceof SkyApiError) {
      return { ok: false, status: err.httpStatus, body: { error: err.code } };
    }
    throw err;
  }

  try {
    const observations = await fetchDonkiObservations(window, apiKey);
    const stored = writeDonkiCache(cacheKey, observations);
    const body = buildSkyResponse(
      queryDate,
      window,
      observations,
      'live' satisfies SkySource,
      stored.storedAt,
    );
    return { ok: true, body, cacheHeaders: true };
  } catch (err) {
    if (err instanceof SkyApiError) {
      return {
        ok: false,
        status: err.httpStatus,
        body: {
          error: err.code,
          message: err.message !== err.code ? err.message : undefined,
        },
      };
    }
    return { ok: false, status: 502, body: { error: 'nasa_unavailable' } };
  }
}
