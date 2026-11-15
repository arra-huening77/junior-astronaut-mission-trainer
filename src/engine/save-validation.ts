import { SAVE_SCHEMA_VERSION } from './contracts';
import type { SaveEnvelope, SolStartSnapshot } from './contracts';
import { createLoadout, validateLoadout } from './loadout';
import { getEventRules, parseEffects, rulesForSky } from './rules';
import { eventForSol, FIXED_EVENT_ORDER } from './schedule';
import { EVENT_IDS } from './types';
import type { FlagId, GameState, Meters } from './types';
import type { SceneCursor } from './scene-types';

export type SaveReadResult =
  | { kind: 'ready'; save: SaveEnvelope }
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'incompatible' };

export interface SaveValidationOptions {
  contentVersion: string;
  isKnownCursor?: (cursor: SceneCursor) => boolean;
}

const phases = [
  'BRIEFING',
  'WALK_SELECT',
  'WALKING',
  'EVENT',
  'CHOICE',
  'MINIGAME',
  'RESULT',
  'REAL_CARD',
  'NIGHT',
  'ENDED',
];
const allFlags = [
  'ignoredFlicker',
  'quickPatch',
  'usedBackupO2',
  'plantsSuffered',
  'usedReserve',
];
const uncommitted = [
  'BRIEFING',
  'WALK_SELECT',
  'WALKING',
  'EVENT',
  'CHOICE',
  'MINIGAME',
];

function requireValue(condition: unknown): asserts condition {
  if (!condition) throw new TypeError('Invalid saved mission.');
}

function object(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  requireValue(value && typeof value === 'object' && !Array.isArray(value));
  const result = value as Record<string, unknown>;
  requireValue(Object.keys(result).every((key) => keys.includes(key)));
  return result;
}

function word(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function utcDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

function timestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    utcDate(value.slice(0, 10)) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) &&
    Number.isFinite(Date.parse(value))
  );
}

function meters(value: unknown): Meters {
  const raw = object(value, ['life', 'power', 'shield']);
  for (const id of ['life', 'power', 'shield']) {
    requireValue(
      typeof raw[id] === 'number' &&
        Number.isFinite(raw[id]) &&
        raw[id] >= 0 &&
        raw[id] <= 100,
    );
  }
  return raw as unknown as Meters;
}

function stringArray(value: unknown, known?: readonly string[]): string[] {
  requireValue(
    Array.isArray(value) &&
      value.every(
        (item: unknown) => word(item) && (!known || known.includes(item)),
      ),
  );
  requireValue(new Set(value).size === value.length);
  return value as string[];
}

function cursor(
  value: unknown,
  state: GameState,
  options: SaveValidationOptions,
): SceneCursor {
  const raw = object(value, [
    'eventId',
    'variant',
    'stepId',
    'selectedChoiceId',
    'miniGameResult',
  ]);
  requireValue(
    raw.eventId === eventForSol(state.sol, state.flags) && word(raw.stepId),
  );
  if (raw.eventId === 'solar_storm')
    requireValue(raw.variant === state.solarVariant);
  else requireValue(raw.variant === undefined);
  if (raw.selectedChoiceId !== undefined)
    requireValue(['A', 'B', 'C'].includes(String(raw.selectedChoiceId)));
  if (raw.miniGameResult !== undefined)
    requireValue(['done', 'skipped'].includes(String(raw.miniGameResult)));
  if (state.phase === 'MINIGAME') {
    requireValue(raw.selectedChoiceId !== undefined);
    const choices = rulesForSky(
      getEventRules(state.schedule[state.sol - 1]),
      state.solarVariant,
    ).choices;
    const selected = choices.find(
      (choice) => choice.id === raw.selectedChoiceId,
    );
    requireValue(selected?.miniGame);
  }
  if (
    !uncommitted.includes(state.phase) &&
    raw.selectedChoiceId !== undefined
  ) {
    requireValue(raw.selectedChoiceId === state.history.at(-1)?.choiceId);
  }
  const result = raw as unknown as SceneCursor;
  if (options.isKnownCursor) requireValue(options.isKnownCursor(result));
  return result;
}

function gameState(value: unknown, contentVersion: string): GameState {
  const raw = object(value, [
    'missionDate',
    'contentVersion',
    'schedule',
    'solarVariant',
    'sky',
    'cargo',
    'modifiers',
    'sol',
    'phase',
    'meters',
    'science',
    'flags',
    'solarPenalty',
    'pending',
    'history',
    'albumIds',
    'ending',
    'failedMeter',
  ]);
  requireValue(
    raw.contentVersion === contentVersion && utcDate(raw.missionDate),
  );
  requireValue(
    typeof raw.sol === 'number' &&
      Number.isInteger(raw.sol) &&
      raw.sol >= 1 &&
      raw.sol <= 10,
  );
  requireValue(typeof raw.phase === 'string' && phases.includes(raw.phase));
  requireValue(['calm', 'active', 'stormy'].includes(String(raw.solarVariant)));
  meters(raw.meters);
  requireValue(
    typeof raw.science === 'number' &&
      Number.isInteger(raw.science) &&
      raw.science >= 0,
  );
  requireValue(
    typeof raw.solarPenalty === 'number' &&
      Number.isFinite(raw.solarPenalty) &&
      raw.solarPenalty >= 0,
  );
  const selectedCargo = stringArray(raw.cargo);
  requireValue(validateLoadout(selectedCargo).valid);
  const state = raw as unknown as GameState;
  const modifiers = object(raw.modifiers, [
    'solarGain',
    'baseLoad',
    'lifeUpkeep',
    'startBonus',
  ]);
  const expected = createLoadout(state.cargo);
  for (const key of ['solarGain', 'baseLoad', 'lifeUpkeep'] as const)
    requireValue(modifiers[key] === expected[key]);
  const bonuses = object(modifiers.startBonus, ['life', 'power', 'shield']);
  for (const key of ['life', 'power', 'shield'] as const)
    requireValue((bonuses[key] ?? 0) === (expected.startBonus[key] ?? 0));
  const flags = stringArray(raw.flags, allFlags);
  requireValue(Array.isArray(raw.schedule) && raw.schedule.length === 10);
  for (let index = 0; index < 10; index++) {
    const expectedId =
      index === 7 && state.sol >= 8
        ? eventForSol(8, state.flags)
        : FIXED_EVENT_ORDER[index];
    requireValue(raw.schedule[index] === expectedId);
  }
  const sky = object(raw.sky, [
    'level',
    'source',
    'eventId',
    'observedAt',
    'fetchedAt',
    'sourceUrl',
  ]);
  requireValue(
    sky.level === state.solarVariant &&
      ['live', 'cache', 'saved'].includes(String(sky.source)) &&
      timestamp(sky.fetchedAt),
  );
  if (sky.eventId !== undefined) requireValue(word(sky.eventId));
  if (sky.observedAt !== undefined) requireValue(timestamp(sky.observedAt));
  if (sky.sourceUrl !== undefined) {
    requireValue(word(sky.sourceUrl));
    requireValue(['https:', 'http:'].includes(new URL(sky.sourceUrl).protocol));
  }
  requireValue(Array.isArray(raw.pending));
  for (const pending of raw.pending) {
    const item = object(pending, ['appliesAtSol', 'effects']);
    requireValue(
      typeof item.appliesAtSol === 'number' &&
        Number.isInteger(item.appliesAtSol) &&
        item.appliesAtSol > state.sol,
    );
    parseEffects(item.effects);
  }
  stringArray(raw.albumIds);
  requireValue(Array.isArray(raw.history) && raw.history.length <= 10);
  const reconstructedFlags: FlagId[] = [];
  for (let index = 0; index < raw.history.length; index++) {
    const item = object(raw.history[index], [
      'sol',
      'eventId',
      'choiceId',
      'miniGame',
      'meters',
    ]);
    requireValue(item.sol === index + 1 && index + 1 <= state.sol);
    requireValue(item.eventId === eventForSol(index + 1, reconstructedFlags));
    requireValue(
      EVENT_IDS.includes(
        item.eventId as GameState['history'][number]['eventId'],
      ),
    );
    const choices = rulesForSky(
      getEventRules(item.eventId as GameState['history'][number]['eventId']),
      state.solarVariant,
    ).choices;
    const choice = choices.find((entry) => entry.id === item.choiceId);
    requireValue(choice);
    if (item.miniGame !== undefined)
      requireValue(
        choice.miniGame && ['done', 'skipped'].includes(String(item.miniGame)),
      );
    meters(item.meters);
    for (const flag of choice.effects.setFlags ?? [])
      if (!reconstructedFlags.includes(flag)) reconstructedFlags.push(flag);
  }
  requireValue(
    flags.length === reconstructedFlags.length &&
      flags.every((flag) => reconstructedFlags.includes(flag as FlagId)),
  );
  const expectedHistory = uncommitted.includes(state.phase)
    ? state.sol - 1
    : state.sol;
  requireValue(state.history.length === expectedHistory);
  if (state.phase === 'ENDED') {
    requireValue(state.ending === 'success' || state.ending === 'gentle');
    if (state.ending === 'success') {
      requireValue(
        state.sol === 10 &&
          Object.values(state.meters).every((value) => value > 0) &&
          state.failedMeter === undefined,
      );
    } else {
      requireValue(
        state.failedMeter &&
          ['life', 'power', 'shield'].includes(state.failedMeter) &&
          state.meters[state.failedMeter] === 0,
      );
    }
  } else
    requireValue(state.ending === undefined && state.failedMeter === undefined);
  return state;
}

export function readSave(
  serialized: string | null,
  options: SaveValidationOptions,
): SaveReadResult {
  if (serialized === null) return { kind: 'empty' };
  try {
    const raw = object(JSON.parse(serialized), [
      'schemaVersion',
      'contentVersion',
      'runId',
      'savedAt',
      'checkpoint',
      'state',
      'cursor',
    ]);
    if (
      raw.schemaVersion !== SAVE_SCHEMA_VERSION ||
      raw.contentVersion !== options.contentVersion
    )
      return { kind: 'incompatible' };
    requireValue(word(raw.runId) && timestamp(raw.savedAt));
    const state = gameState(raw.state, options.contentVersion);
    const checkpoint = raw.checkpoint;
    if (checkpoint === 'launch')
      requireValue(state.sol === 1 && uncommitted.includes(state.phase));
    else if (checkpoint === 'sol_start')
      requireValue(uncommitted.includes(state.phase));
    else if (checkpoint === 'choice_result')
      requireValue(['RESULT', 'REAL_CARD'].includes(state.phase));
    else if (checkpoint === 'night') requireValue(state.phase === 'NIGHT');
    else if (checkpoint === 'ending') requireValue(state.phase === 'ENDED');
    else throw new TypeError('Unknown checkpoint.');
    if (raw.cursor !== undefined) cursor(raw.cursor, state, options);
    else requireValue(!['WALKING', 'MINIGAME'].includes(state.phase));
    return {
      kind: 'ready',
      save: structuredClone(raw) as unknown as SaveEnvelope,
    };
  } catch {
    return { kind: 'invalid' };
  }
}

export function validateSolStartSnapshot(
  state: GameState,
  position: SceneCursor,
): SolStartSnapshot {
  requireValue(state.phase === 'BRIEFING');
  const checked = gameState(state, state.contentVersion);
  const checkedCursor = cursor(position, checked, {
    contentVersion: state.contentVersion,
  });
  return structuredClone({ state: checked, cursor: checkedCursor });
}

/** Normalize transient presentation only; never invoke resource transition functions on load. */
export function prepareForContinue(save: SaveEnvelope): SaveEnvelope {
  const restored = structuredClone(save);
  if (restored.state.phase === 'WALKING') restored.state.phase = 'WALK_SELECT';
  if (restored.state.phase === 'MINIGAME' && restored.cursor)
    delete restored.cursor.miniGameResult;
  return restored;
}
