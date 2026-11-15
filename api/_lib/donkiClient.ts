import { z } from 'zod';
import { isCalendarDate } from '../../src/engine/observation-time';

import type { DonkiObservationSet } from '../../src/engine/sky';
import { SkyApiError } from './skyErrors';

/** NASA DONKI REST paths (api.nasa.gov). */
export const DONKI_PATHS = ['FLR', 'CME', 'SEP'] as const;
export type DonkiPath = (typeof DONKI_PATHS)[number];

const NASA_DONKI_ORIGIN = 'https://api.nasa.gov/DONKI';
export const SKY_FETCH_TIMEOUT_MS = 4_000;
export const DONKI_LOOKBACK_DAYS = 7;

const donkiListSchema = z.array(z.record(z.string(), z.unknown()));

export interface DonkiWindow {
  windowStart: string;
  windowEnd: string;
}

export function parseQueryDate(raw: unknown): string {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new SkyApiError('invalid_date', 400, 'Use ?date=YYYY-MM-DD');
  }
  const parsed = Date.parse(`${raw}T00:00:00.000Z`);
  if (!isCalendarDate(raw) || Number.isNaN(parsed)) {
    throw new SkyApiError('invalid_date', 400, 'Use ?date=YYYY-MM-DD');
  }
  return raw;
}

/** Last seven UTC days ending on `queryDate` (inclusive end). */
export function donkiWindowForQueryDate(queryDate: string): DonkiWindow {
  const end = new Date(`${queryDate}T00:00:00.000Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - DONKI_LOOKBACK_DAYS);
  return {
    windowStart: formatUtcDate(start),
    windowEnd: formatUtcDate(end),
  };
}

function formatUtcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function cacheKeyForWindow(window: DonkiWindow): string {
  return `${window.windowStart}:${window.windowEnd}`;
}

function buildDonkiUrl(
  path: DonkiPath,
  window: DonkiWindow,
  apiKey: string,
): URL {
  const url = new URL(`${NASA_DONKI_ORIGIN}/${path}`);
  url.searchParams.set('startDate', window.windowStart);
  url.searchParams.set('endDate', window.windowEnd);
  url.searchParams.set('api_key', apiKey);
  return url;
}

async function fetchDonkiPath(
  path: DonkiPath,
  window: DonkiWindow,
  apiKey: string,
  signal: AbortSignal,
): Promise<unknown[]> {
  const url = buildDonkiUrl(path, window, apiKey);
  let response: Response;
  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch {
    if (signal.aborted) {
      throw new SkyApiError('nasa_timeout', 504);
    }
    throw new SkyApiError('nasa_unavailable', 502);
  }

  if (response.status === 429) {
    throw new SkyApiError('rate_limited', 429);
  }
  if (response.status === 401 || response.status === 403) {
    throw new SkyApiError('config_missing', 503);
  }
  if (!response.ok) {
    throw new SkyApiError('nasa_unavailable', 502);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new SkyApiError('malformed_response', 502);
  }

  const parsed = donkiListSchema.safeParse(body);
  if (!parsed.success) {
    throw new SkyApiError('malformed_response', 502);
  }

  return parsed.data;
}

export async function fetchDonkiObservations(
  window: DonkiWindow,
  apiKey: string,
  timeoutMs = SKY_FETCH_TIMEOUT_MS,
): Promise<DonkiObservationSet> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const [flares, cmes, seps] = await Promise.all(
      DONKI_PATHS.map((path) =>
        fetchDonkiPath(path, window, apiKey, controller.signal),
      ),
    );
    return { flares, cmes, seps };
  } finally {
    clearTimeout(timer);
  }
}
