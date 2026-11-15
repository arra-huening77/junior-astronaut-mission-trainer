import cargoData from '../content/cargo.json';
import { BALANCE } from './balance';
import type { CargoDefinition, CargoId, Modifiers } from './types';

const CARGO_IDS: readonly CargoId[] = [
  'solar_extra',
  'batteries',
  'shield_plating',
  'greenhouse_kit',
  'water_recycler',
  'spare_parts',
  'rover_fuel',
  'radio_booster',
];

function cargoId(value: string): CargoId {
  const id = CARGO_IDS.find((known) => known === value);
  if (!id) throw new TypeError(`Unknown cargo ID: ${value}`);
  return id;
}

const catalog: CargoDefinition[] = cargoData.map((item) => ({
  ...item,
  id: cargoId(item.id),
}));
if (
  catalog.length !== CARGO_IDS.length ||
  new Set(catalog.map((item) => item.id)).size !== CARGO_IDS.length
) {
  throw new TypeError(
    'Cargo catalog must contain each confirmed package once.',
  );
}

export type LoadoutCheck =
  | { valid: true; weight: number }
  | {
      valid: false;
      reason: 'unknown' | 'duplicate' | 'over_budget';
      weight: number;
    };

export function getCargoCatalog(): CargoDefinition[] {
  return structuredClone(catalog);
}

export function validateLoadout(selection: readonly string[]): LoadoutCheck {
  let weight = 0;
  const seen = new Set<string>();
  for (const id of selection) {
    const item = catalog.find((entry) => entry.id === id);
    if (!item) return { valid: false, reason: 'unknown', weight };
    if (seen.has(id)) return { valid: false, reason: 'duplicate', weight };
    seen.add(id);
    weight += item.weight;
  }
  return weight > BALANCE.cargoBudget
    ? { valid: false, reason: 'over_budget', weight }
    : { valid: true, weight };
}

/** Packages modify production/upkeep/start bonuses, never the 100-point capacity. */
export function createLoadout(selection: readonly CargoId[]): Modifiers {
  const check = validateLoadout(selection);
  if (!check.valid)
    throw new RangeError(`Invalid cargo selection: ${check.reason}`);
  const result: Modifiers = {
    solarGain: BALANCE.solarGain,
    baseLoad: BALANCE.baseLoad,
    lifeUpkeep: BALANCE.lifeUpkeep,
    startBonus: {},
  };
  for (const id of selection) {
    const item = catalog.find((entry) => entry.id === id)!;
    const modifiers = item.modifiers;
    if (!modifiers) continue;
    result.solarGain += modifiers.solarGain ?? 0;
    result.baseLoad += modifiers.baseLoad ?? 0;
    result.lifeUpkeep += modifiers.lifeUpkeep ?? 0;
    for (const meter of ['life', 'power', 'shield'] as const) {
      const bonus = modifiers.startBonus?.[meter];
      if (bonus !== undefined)
        result.startBonus[meter] = (result.startBonus[meter] ?? 0) + bonus;
    }
  }
  return result;
}
