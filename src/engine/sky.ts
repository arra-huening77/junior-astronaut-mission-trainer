/**
 * Pure NASA DONKI → mission sky level classification.
 * No React, no network I/O. Game fiction must not enter this module.
 *
 * README §7.8 game categories (not a Mars forecast):
 * - stormy: X-class solar flare or energetic particle event
 * - active: M-class solar flare or fast CME
 * - calm: otherwise, when **valid** observation data is available
 *
 * ## Open thresholds — confirm with Member 1 (README does not give exact values)
 *
 * 1. **Fast CME:** `FAST_CME_SPEED_KM_S` is provisional (currently 1000 km/s on DONKI
 *    `speed` / `cmeAnalyses[].speed`). NASA sample verification required before release.
 * 2. **Qualifying SEP:** provisional rule — a DONKI SEP row with at least one of
 *    `sepID`, `eventTime`, `link`, or a non-empty `instruments` list counts as an
 *    energetic particle event. README does not define intensity / instrument filters.
 *
 * Member 1: please lock CME speed and SEP qualification before final integration tests.
 */

import type { SkyLevel } from './types';

export type { SkyLevel };

export type DonkiObservationKind = 'FLR' | 'CME' | 'SEP';

/**
 * Provisional fast-CME threshold (km/s). **Not confirmed in README** — Member 1 sign-off.
 * @see module header for coordination note
 */
export const FAST_CME_SPEED_KM_S = 1000;

const SEVERITY_RANK: Record<SkyLevel, number> = {
  calm: 0,
  active: 1,
  stormy: 2,
};

export interface DonkiObservationSet {
  flares?: unknown;
  cmes?: unknown;
  seps?: unknown;
}

export type SkyInputIssue = 'missing_channels' | 'invalid_shape';

export interface ClassifiedDonkiEvent {
  observationType: DonkiObservationKind;
  eventId?: string;
  eventDate?: string;
  details: string;
  sourceUrl?: string;
}

export interface SkyClassificationSuccess {
  ok: true;
  level: SkyLevel;
  /** Highest-severity qualifying record used for the level. */
  primaryEvent?: ClassifiedDonkiEvent;
  /** All qualifying NASA records, deduplicated (metadata only; not game events). */
  qualifyingEvents: ClassifiedDonkiEvent[];
}

export interface SkyClassificationFailure {
  ok: false;
  reason: SkyInputIssue;
}

export type SkyClassificationResult =
  SkyClassificationSuccess | SkyClassificationFailure;

export class SkyClassificationError extends Error {
  readonly reason: SkyInputIssue;

  constructor(reason: SkyInputIssue) {
    super(reason);
    this.reason = reason;
  }
}

/**
 * Returns only `SkyLevel` when input is valid. Throws when data is missing or unusable
 * (never maps unavailable input to `calm`).
 */
export function classifySkyLevel(input: DonkiObservationSet): SkyLevel {
  const result = classifySkyFromDonki(input);
  if (!result.ok) {
    throw new SkyClassificationError(result.reason);
  }
  return result.level;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asObservationArray(value: unknown): unknown[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;
  return value;
}

type ChannelState = 'ok' | 'missing' | 'invalid';

function channelState(value: unknown): ChannelState {
  if (value === undefined) return 'missing';
  if (!Array.isArray(value)) return 'invalid';
  return 'ok';
}

/** Requires all three DONKI channels to be present as arrays (empty allowed). */
export function validateDonkiObservationSet(
  input: DonkiObservationSet,
): SkyInputIssue | null {
  if (!isRecord(input)) return 'invalid_shape';

  const states = [
    channelState(input.flares),
    channelState(input.cmes),
    channelState(input.seps),
  ];

  if (states.includes('invalid')) return 'invalid_shape';
  if (states.includes('missing')) return 'missing_channels';
  return null;
}

function readString(
  record: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const v = record[key];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return undefined;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const v = record[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function parseFlareClassLetter(
  classType: unknown,
): 'X' | 'M' | 'C' | 'B' | 'A' | null {
  if (typeof classType !== 'string') return null;
  const trimmed = classType.trim();
  if (!trimmed) return null;
  const letter = trimmed.charAt(0).toUpperCase();
  if (
    letter === 'X' ||
    letter === 'M' ||
    letter === 'C' ||
    letter === 'B' ||
    letter === 'A'
  ) {
    return letter;
  }
  return null;
}

function flarePeakLevel(classType: unknown): SkyLevel | null {
  const letter = parseFlareClassLetter(classType);
  if (letter === 'X') return 'stormy';
  if (letter === 'M') return 'active';
  return null;
}

function bestCmeSpeed(
  record: Record<string, unknown>,
): { speed: number; sourceUrl?: string } | undefined {
  const direct = readNumber(record, 'speed');
  let bestSpeed = direct;
  let bestLink: string | undefined =
    direct !== undefined ? readString(record, 'link') : undefined;

  const analyses = record.cmeAnalyses;
  if (Array.isArray(analyses)) {
    for (const entry of analyses) {
      if (!isRecord(entry)) continue;
      const s = readNumber(entry, 'speed');
      if (s === undefined) continue;
      if (bestSpeed === undefined || s > bestSpeed) {
        bestSpeed = s;
        bestLink = readString(entry, 'link') ?? bestLink;
      }
    }
  }

  if (bestSpeed === undefined) return undefined;
  return { speed: bestSpeed, sourceUrl: bestLink };
}

function classifyFlareRecord(raw: unknown): {
  level: SkyLevel | null;
  event?: ClassifiedDonkiEvent;
} {
  if (!isRecord(raw)) return { level: null };

  const classType = raw.classType;
  const level = flarePeakLevel(classType);
  if (level === null) return { level: null };

  const eventDate = readString(raw, 'peakTime', 'beginTime', 'endTime');
  const eventId = readString(raw, 'flrID');
  const sourceUrl = readString(raw, 'link');
  const classLabel = typeof classType === 'string' ? classType.trim() : '';

  const details =
    classLabel !== ''
      ? `Solar flare class ${classLabel}`
      : 'Solar flare (class not recorded)';

  return {
    level,
    event: {
      observationType: 'FLR',
      eventId,
      eventDate,
      details,
      sourceUrl,
    },
  };
}

function classifyCmeRecord(raw: unknown): {
  level: SkyLevel | null;
  event?: ClassifiedDonkiEvent;
} {
  if (!isRecord(raw)) return { level: null };

  const speedInfo = bestCmeSpeed(raw);
  if (speedInfo === undefined || speedInfo.speed < FAST_CME_SPEED_KM_S)
    return { level: null };

  const eventDate = readString(raw, 'time21_5', 'startTime', 'activityID');
  const eventId = readString(raw, 'associatedCMEID', 'activityID', 'cmeID');
  const sourceUrl = speedInfo.sourceUrl ?? readString(raw, 'link');
  const cmeType = readString(raw, 'type');
  const { speed } = speedInfo;

  const detailsParts = [`CME speed ${speed} km/s`];
  if (cmeType) detailsParts.push(`type ${cmeType}`);

  return {
    level: 'active',
    event: {
      observationType: 'CME',
      eventId,
      eventDate,
      details: detailsParts.join(', '),
      sourceUrl,
    },
  };
}

function classifySepRecord(raw: unknown): {
  level: SkyLevel | null;
  event?: ClassifiedDonkiEvent;
} {
  if (!isRecord(raw)) return { level: null };

  const eventDate = readString(raw, 'eventTime');
  const eventId = readString(raw, 'sepID');
  const sourceUrl = readString(raw, 'link');

  const hasSignal =
    eventId !== undefined ||
    eventDate !== undefined ||
    sourceUrl !== undefined ||
    (Array.isArray(raw.instruments) && raw.instruments.length > 0);

  if (!hasSignal) return { level: null };

  const instrumentNames: string[] = [];
  if (Array.isArray(raw.instruments)) {
    for (const inst of raw.instruments) {
      if (!isRecord(inst)) continue;
      const name = readString(inst, 'displayName');
      if (name) instrumentNames.push(name);
    }
  }

  const details =
    instrumentNames.length > 0
      ? `Solar energetic particle event (${instrumentNames.join(', ')})`
      : 'Solar energetic particle event';

  return {
    level: 'stormy',
    event: {
      observationType: 'SEP',
      eventId,
      eventDate,
      details,
      sourceUrl,
    },
  };
}

interface ScoredEvent {
  level: SkyLevel;
  event: ClassifiedDonkiEvent;
  sortKey: string;
}

function eventSortKey(event: ClassifiedDonkiEvent): string {
  return event.eventDate ?? '';
}

function dedupeKey(event: ClassifiedDonkiEvent): string {
  return [
    event.observationType,
    event.eventId ?? '',
    event.eventDate ?? '',
    event.details,
    event.sourceUrl ?? '',
  ].join('|');
}

function dedupeQualifying(
  events: ClassifiedDonkiEvent[],
): ClassifiedDonkiEvent[] {
  const seen = new Set<string>();
  const out: ClassifiedDonkiEvent[] = [];
  for (const event of events) {
    const key = dedupeKey(event);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event);
  }
  return out;
}

function pickPrimary(
  candidates: ScoredEvent[],
): ClassifiedDonkiEvent | undefined {
  if (candidates.length === 0) return undefined;

  let best = candidates[0];
  for (const c of candidates.slice(1)) {
    const rankDiff = SEVERITY_RANK[c.level] - SEVERITY_RANK[best.level];
    if (rankDiff > 0) {
      best = c;
      continue;
    }
    if (rankDiff === 0 && eventSortKey(c.event) > eventSortKey(best.event)) {
      best = c;
    }
  }
  return best.event;
}

/**
 * Classify mission sky from DONKI FLR, CME and SEP payloads (already fetched elsewhere).
 * Valid empty windows classify as `calm`. Missing or invalid channel data returns `ok: false`.
 */
export function classifySkyFromDonki(
  input: DonkiObservationSet,
): SkyClassificationResult {
  const issue = validateDonkiObservationSet(input);
  if (issue !== null) {
    return { ok: false, reason: issue };
  }

  const flares = asObservationArray(input.flares)!;
  const cmes = asObservationArray(input.cmes)!;
  const seps = asObservationArray(input.seps)!;

  const candidates: ScoredEvent[] = [];

  for (const raw of flares) {
    const { level, event } = classifyFlareRecord(raw);
    if (level !== null && event)
      candidates.push({ level, event, sortKey: eventSortKey(event) });
  }
  for (const raw of cmes) {
    const { level, event } = classifyCmeRecord(raw);
    if (level !== null && event)
      candidates.push({ level, event, sortKey: eventSortKey(event) });
  }
  for (const raw of seps) {
    const { level, event } = classifySepRecord(raw);
    if (level !== null && event)
      candidates.push({ level, event, sortKey: eventSortKey(event) });
  }

  const qualifyingEvents = dedupeQualifying(candidates.map((c) => c.event));

  if (qualifyingEvents.length === 0) {
    return { ok: true, level: 'calm', qualifyingEvents: [] };
  }

  let maxLevel: SkyLevel = 'calm';
  for (const c of candidates) {
    if (SEVERITY_RANK[c.level] > SEVERITY_RANK[maxLevel]) maxLevel = c.level;
  }

  const atMax = candidates.filter((c) => c.level === maxLevel);
  const primaryEvent = pickPrimary(atMax);

  return {
    ok: true,
    level: maxLevel,
    primaryEvent,
    qualifyingEvents,
  };
}
