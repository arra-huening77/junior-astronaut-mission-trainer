/**
 * Browser adapter for POST /api/debrief. Non-blocking; 3s display deadline; local template fallback.
 */

import { z } from 'zod';

import type { DebriefRequest, DebriefResponse } from '../engine/contracts';
import type { MeterId, SkyLevel } from '../engine/types';
import { validateDebriefOutput } from '../../api/_lib/debriefOutput';
import { debriefRequestSchema } from '../../api/_lib/debriefValidate';

export const DEBRIEF_DISPLAY_DEADLINE_MS = 3_000;
export const DEBRIEF_STORAGE_PREFIX = 'mms.debrief.';
export const DEBRIEF_LABEL_AI = 'Written by AI' as const;
export const DEBRIEF_LABEL_TEMPLATE = "Robo's mission summary" as const;

const debriefResponseSchema = z
  .object({
    source: z.union([z.literal('ai'), z.literal('template')]),
    text: z.string(),
  })
  .strict();

export interface DebriefTemplateLines {
  /** Keys like `3_dust_storm_A` or `6_solar_storm_active_B`. */
  choiceObservations: Record<string, string>;
  endings: {
    success: string;
    gentle: Record<MeterId, string>;
  };
  hints: Record<'life' | 'power' | 'shield' | 'success', string>;
  generic: {
    observation: string;
  };
}

export interface DisplayedDebrief {
  text: string;
  source: 'ai' | 'template';
  label: typeof DEBRIEF_LABEL_AI | typeof DEBRIEF_LABEL_TEMPLATE;
}

export interface FetchDebriefOptions {
  payload: DebriefRequest;
  /** Dev-only: `?fail=ai` on the request (README §16). */
  simulateApiFailure?: boolean;
  fetchImpl?: typeof fetch;
  now?: number;
  /** Override display deadline (tests). */
  displayDeadlineMs?: number;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Story-script §13 template fragments (Member 3 may replace via `registerDebriefTemplates`). */
const DEFAULT_DEBRIEF_TEMPLATES: DebriefTemplateLines = {
  choiceObservations: {},
  endings: {
    success:
      'You kept the outpost running through ten sols until the supply ship arrived.',
    gentle: {
      life: 'Life Support ran out, so the crew moved into the shelter to wait safely.',
      power: 'Stored power ran out, so the crew waited safely in the shelter.',
      shield:
        'Protection ran too low, so the crew moved into the shelter to stay safe.',
    },
  },
  hints: {
    life: 'Next time, check how each choice affects air and water before sending the crew onward.',
    power:
      'Next time, compare repair and heating costs and plan which power supplies to bring.',
    shield:
      'Next time, compare shielding and shelter choices before continuing research during the solar encounter.',
    success:
      'On another mission, try a different cargo plan and explore how its tradeoffs change your choices.',
  },
  generic: {
    observation:
      "You made choices about the outpost's supplies and saw how each decision changed the mission.",
  },
};

let bundledTemplates: DebriefTemplateLines = DEFAULT_DEBRIEF_TEMPLATES;
const frozenBySession = new Map<string, DisplayedDebrief>();
const inFlightBySession = new Map<string, Promise<DisplayedDebrief>>();
let activeRequestGeneration = 0;

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Member 3 registers `debriefTemplates.json` before the first debrief fetch. */
export function registerDebriefTemplates(
  templates: DebriefTemplateLines,
): void {
  bundledTemplates = templates;
}

export function resetDebriefServiceState(): void {
  bundledTemplates = DEFAULT_DEBRIEF_TEMPLATES;
  frozenBySession.clear();
  inFlightBySession.clear();
  activeRequestGeneration = 0;
}

export function debriefSessionKey(payload: DebriefRequest): string {
  return JSON.stringify(payload);
}

export function parseDebriefResponse(raw: unknown): DebriefResponse | null {
  const parsed = debriefResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Strip unknown fields and reject forbidden prompt keys before POST. */
export function sanitizeDebriefRequest(
  raw: DebriefRequest,
): DebriefRequest | null {
  const parsed = debriefRequestSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function choiceTemplateKey(
  sol: number,
  event: string,
  choice: string,
  skyLevel: SkyLevel,
): string {
  if (event === 'solar_storm') {
    return `6_solar_storm_${skyLevel}_${choice}`;
  }
  return `${sol}_${event}_${choice}`;
}

function composeObservation(payload: DebriefRequest): string {
  const templates = bundledTemplates;
  const last = payload.history[payload.history.length - 1];
  if (!last) return templates.generic.observation;

  const key = choiceTemplateKey(
    last.sol,
    last.event,
    last.choice,
    payload.skyLevel,
  );
  return templates.choiceObservations[key] ?? templates.generic.observation;
}

function composeEnding(payload: DebriefRequest): string {
  if (payload.ending === 'success') {
    return bundledTemplates.endings.success;
  }
  const meter = payload.failedMeter;
  if (meter) {
    return bundledTemplates.endings.gentle[meter];
  }
  return bundledTemplates.endings.gentle.power;
}

function composeHint(payload: DebriefRequest): string {
  if (payload.ending === 'success') {
    return bundledTemplates.hints.success;
  }
  const meter = payload.failedMeter;
  if (meter) {
    return bundledTemplates.hints[meter];
  }
  return bundledTemplates.hints.power;
}

/** Local rule-based summary — only authored template lines, keyed to real history where available. */
export function composeLocalDebriefTemplate(payload: DebriefRequest): string {
  const sentences = [
    composeObservation(payload),
    composeEnding(payload),
    composeHint(payload),
  ];
  return sentences.join(' ');
}

export function prepareLocalDebriefDisplay(
  payload: DebriefRequest,
): DisplayedDebrief {
  return {
    text: composeLocalDebriefTemplate(payload),
    source: 'template',
    label: DEBRIEF_LABEL_TEMPLATE,
  };
}

export function labelForSource(
  source: 'ai' | 'template',
): DisplayedDebrief['label'] {
  return source === 'ai' ? DEBRIEF_LABEL_AI : DEBRIEF_LABEL_TEMPLATE;
}

function toAiDisplay(text: string): DisplayedDebrief {
  return { text, source: 'ai', label: DEBRIEF_LABEL_AI };
}

export function debriefCacheKey(sessionKey: string): string {
  return `${DEBRIEF_STORAGE_PREFIX}${sessionKey}`;
}

export function readDebriefCache(
  sessionKey: string,
  storage: StorageLike | null = defaultStorage(),
): DisplayedDebrief | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(debriefCacheKey(sessionKey));
    if (!raw) return null;
    const record = JSON.parse(raw) as { debrief: DisplayedDebrief };
    if (
      !record.debrief ||
      typeof record.debrief.text !== 'string' ||
      (record.debrief.source !== 'ai' && record.debrief.source !== 'template')
    ) {
      return null;
    }
    return record.debrief;
  } catch {
    return null;
  }
}

export function writeDebriefCache(
  sessionKey: string,
  debrief: DisplayedDebrief,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): void {
  if (!storage) return;
  try {
    storage.setItem(
      debriefCacheKey(sessionKey),
      JSON.stringify({ debrief, storedAt: new Date(now).toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

function resolveAiWireResponse(wire: DebriefResponse): DisplayedDebrief | null {
  if (wire.source !== 'ai') return null;
  const checked = validateDebriefOutput(wire.text);
  if (!checked.ok) return null;
  return toAiDisplay(checked.text);
}

async function postDebrief(
  payload: DebriefRequest,
  options: {
    simulateApiFailure?: boolean;
    fetchImpl: typeof fetch;
    signal: AbortSignal;
    generation: number;
  },
): Promise<DebriefResponse | null> {
  const params = new URLSearchParams();
  if (options.simulateApiFailure) params.set('fail', 'ai');

  const path =
    params.size > 0 ? `/api/debrief?${params.toString()}` : '/api/debrief';

  try {
    const res = await options.fetchImpl(path, {
      method: 'POST',
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (options.generation !== activeRequestGeneration) return null;
    if (!res.ok) return null;

    const body: unknown = await res.json();
    return parseDebriefResponse(body);
  } catch {
    return null;
  }
}

/**
 * Resolves the debrief text to show for this mission run. Call without blocking navigation;
 * the report can render immediately while this promise settles.
 */
export async function fetchDebriefForMission(
  options: FetchDebriefOptions,
): Promise<DisplayedDebrief> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const deadlineMs = options.displayDeadlineMs ?? DEBRIEF_DISPLAY_DEADLINE_MS;

  const safePayload = sanitizeDebriefRequest(options.payload);
  if (!safePayload) {
    return prepareLocalDebriefDisplay(options.payload);
  }

  const sessionKey = debriefSessionKey(safePayload);
  const frozen = frozenBySession.get(sessionKey);
  if (frozen) return frozen;

  const cached = readDebriefCache(sessionKey);
  if (cached) {
    frozenBySession.set(sessionKey, cached);
    return cached;
  }

  const inFlight = inFlightBySession.get(sessionKey);
  if (inFlight) return inFlight;

  const localTemplate = prepareLocalDebriefDisplay(safePayload);
  const generation = (activeRequestGeneration += 1);
  const controller = new AbortController();

  const task = new Promise<DisplayedDebrief>((resolve) => {
    let settled = false;

    const freeze = (display: DisplayedDebrief) => {
      if (settled) return;
      settled = true;
      controller.abort();
      frozenBySession.set(sessionKey, display);
      writeDebriefCache(sessionKey, display);
      resolve(display);
    };

    const deadlineTimer = setTimeout(() => {
      freeze(localTemplate);
    }, deadlineMs);

    void postDebrief(safePayload, {
      simulateApiFailure: options.simulateApiFailure,
      fetchImpl,
      signal: controller.signal,
      generation,
    }).then((wire) => {
      if (settled || generation !== activeRequestGeneration) return;

      if (!wire) {
        clearTimeout(deadlineTimer);
        freeze(localTemplate);
        return;
      }

      const ai = resolveAiWireResponse(wire);
      if (ai) {
        clearTimeout(deadlineTimer);
        freeze(ai);
        return;
      }

      clearTimeout(deadlineTimer);
      freeze(localTemplate);
    });
  }).finally(() => {
    inFlightBySession.delete(sessionKey);
  });

  inFlightBySession.set(sessionKey, task);
  return task;
}

/** Returns false when a summary is already frozen (never swap template for late AI). */
export function applyLateDebriefIfAllowed(
  sessionKey: string,
  wire: DebriefResponse,
): boolean {
  if (frozenBySession.has(sessionKey)) return false;

  const ai = resolveAiWireResponse(wire);
  if (!ai) return false;

  frozenBySession.set(sessionKey, ai);
  writeDebriefCache(sessionKey, ai);
  return true;
}

export function getFrozenDebrief(
  sessionKey: string,
): DisplayedDebrief | undefined {
  return frozenBySession.get(sessionKey);
}
