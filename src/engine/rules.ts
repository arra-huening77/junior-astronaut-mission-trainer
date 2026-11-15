import eventData from '../content/events.json';
import { EVENT_IDS } from './types';
import type {
  CargoId,
  ChoiceDefinition,
  ChoiceId,
  Effects,
  EventId,
  EventVariant,
  FlagId,
  MiniGameId,
  SkyLevel,
} from './types';

/** Rules-only content. Scene/mood/fact metadata is added with verified timeline content. */
export type RuleSet = Pick<EventVariant, 'choices'>;
export type EventRules = RuleSet & {
  id: EventId;
  variants?: Record<SkyLevel, RuleSet>;
};
const flags: readonly FlagId[] = [
  'ignoredFlicker',
  'quickPatch',
  'usedBackupO2',
  'plantsSuffered',
  'usedReserve',
];
const cargoIds: readonly CargoId[] = [
  'solar_extra',
  'batteries',
  'shield_plating',
  'greenhouse_kit',
  'water_recycler',
  'spare_parts',
  'rover_fuel',
  'radio_booster',
];
const games: readonly MiniGameId[] = [
  'cover_panels',
  'rover_drive',
  'repair_wires',
  'patch_leak',
];

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Expected a content object.');
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new TypeError('Expected a content key.');
  return value;
}

function effects(value: unknown): Effects {
  const raw = record(value);
  const parsed: Effects = {};
  for (const key of [
    'life',
    'power',
    'shield',
    'science',
    'solarPenalty',
  ] as const) {
    const delta = raw[key];
    if (delta === undefined) continue;
    if (typeof delta !== 'number' || !Number.isFinite(delta))
      throw new TypeError(`Invalid ${key} effect.`);
    parsed[key] = delta;
  }
  if (raw.noScience !== undefined) {
    if (typeof raw.noScience !== 'boolean')
      throw new TypeError('Invalid noScience value.');
    parsed.noScience = raw.noScience;
  }
  if (raw.setFlags !== undefined) {
    if (!Array.isArray(raw.setFlags)) throw new TypeError('Invalid flag list.');
    parsed.setFlags = raw.setFlags.map((value: unknown) => {
      const flag = flags.find((id) => id === value);
      if (!flag) throw new TypeError('Unknown gameplay flag.');
      return flag;
    });
  }
  if (raw.pending !== undefined) {
    const pending = record(raw.pending);
    if (
      typeof pending.solsLater !== 'number' ||
      !Number.isInteger(pending.solsLater) ||
      pending.solsLater < 1
    ) {
      throw new TypeError(
        'Delayed effects need a positive integer sol offset.',
      );
    }
    parsed.pending = {
      solsLater: pending.solsLater,
      effects: effects(pending.effects),
    };
  }
  const allowed = new Set([
    'life',
    'power',
    'shield',
    'science',
    'solarPenalty',
    'noScience',
    'setFlags',
    'pending',
  ]);
  if (Object.keys(raw).some((key) => !allowed.has(key)))
    throw new TypeError('Unknown effect field.');
  return parsed;
}

function conditional<K extends string>(
  value: unknown,
  ids: readonly K[],
): Partial<Record<K, Effects>> {
  const parsed: Partial<Record<K, Effects>> = {};
  for (const [key, delta] of Object.entries(record(value))) {
    const id = ids.find((item) => item === key);
    if (!id) throw new TypeError(`Unknown condition ID: ${key}`);
    parsed[id] = effects(delta);
  }
  return parsed;
}

function choice<T extends ChoiceId>(
  value: unknown,
  id: T,
): ChoiceDefinition & { id: T } {
  const raw = record(value);
  if (raw.id !== id)
    throw new TypeError('Choices must be A, B and C in order.');
  const parsed: ChoiceDefinition & { id: T } = {
    id,
    labelKey: text(raw.labelKey),
    afterKey: text(raw.afterKey),
    effects: effects(raw.effects),
  };
  if (raw.ifCargo !== undefined)
    parsed.ifCargo = conditional(raw.ifCargo, cargoIds);
  if (raw.ifFlags !== undefined)
    parsed.ifFlags = conditional(raw.ifFlags, flags);
  if (raw.miniGame !== undefined) {
    const mini = record(raw.miniGame);
    const game = games.find((id) => id === mini.id);
    if (!game) throw new TypeError('Unknown mini-game.');
    parsed.miniGame = { id: game, bonus: effects(mini.bonus) };
  }
  return parsed;
}

function ruleSet(value: unknown): RuleSet {
  const raw = record(value);
  if (!Array.isArray(raw.choices) || raw.choices.length !== 3)
    throw new TypeError('An event needs three choices.');
  return {
    choices: [
      choice(raw.choices[0], 'A'),
      choice(raw.choices[1], 'B'),
      choice(raw.choices[2], 'C'),
    ],
  };
}

export function parseEventRules(value: unknown): EventRules {
  const raw = record(value);
  const id = EVENT_IDS.find((id) => id === raw.id);
  if (!id) throw new TypeError('Unknown event ID.');
  const parsed: EventRules = { id, ...ruleSet(raw) };
  if (id === 'solar_storm') {
    const variants = record(raw.variants);
    parsed.variants = {
      calm: ruleSet(variants.calm),
      active: ruleSet(variants.active),
      stormy: ruleSet(variants.stormy),
    };
  } else if (raw.variants !== undefined) {
    throw new TypeError('Only the solar encounter has sky variants.');
  }
  return parsed;
}

const catalog = eventData.map(parseEventRules);
if (
  catalog.length !== EVENT_IDS.length ||
  new Set(catalog.map((entry) => entry.id)).size !== EVENT_IDS.length
) {
  throw new TypeError('Rules must contain each confirmed event ID once.');
}

export function getEventRules(id: EventId): EventRules {
  const event = catalog.find((entry) => entry.id === id);
  if (!event) throw new TypeError(`No authored rules for ${id}`);
  return structuredClone(event);
}

/** Solar variant costs replace the stormy reference; never add both. */
export function rulesForSky(event: EventRules, sky: SkyLevel): RuleSet {
  if (event.id !== 'solar_storm') return event;
  const variant = event.variants?.[sky];
  if (!variant) throw new TypeError('Missing authored solar variant.');
  return variant;
}

// Shared by save validation; unknown effect keys are rejected.
export { effects as parseEffects };
