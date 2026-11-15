import type { CargoId, SkyLevel } from '../../../engine/types';
import { BALANCE } from '../../../engine/balance';

export type PlanCargoItem = {
  id: CargoId;
  name: string;
  hint: string;
  weight: number;
  iconSrc: string;
};

/** README §7.7 starter cargo — values stay in balance/cargo data later. */
export const PLAN_CARGO: PlanCargoItem[] = [
  {
    id: 'solar_extra',
    name: 'Extra solar panels',
    hint: 'Extra panels make more power each sol. They take up cargo space.',
    weight: 3,
    iconSrc: '/assets/cargo/solar_extra.png',
  },
  {
    id: 'batteries',
    name: 'Big batteries',
    hint: 'These batteries help us use less stored power at night. They do not make sunlight.',
    weight: 2,
    iconSrc: '/assets/cargo/batteries.png',
  },
  {
    id: 'shield_plating',
    name: 'Shield plating',
    hint: 'Shield plating adds starting protection. It leaves less room for other supplies.',
    weight: 3,
    iconSrc: '/assets/cargo/shield_plating.png',
  },
  {
    id: 'greenhouse_kit',
    name: 'Greenhouse kit',
    hint: 'This kit reduces our daily Life Support use. It is heavy.',
    weight: 3,
    iconSrc: '/assets/cargo/greenhouse_kit.png',
  },
  {
    id: 'water_recycler',
    name: 'Water recycler',
    hint: 'The recycler adds to our starting water supplies. That starting bonus happens once.',
    weight: 2,
    iconSrc: '/assets/cargo/water_recycler.png',
  },
  {
    id: 'spare_parts',
    name: 'Spare parts',
    hint: 'Spare parts reduce the power cost of repairs. They help when equipment needs fixing.',
    weight: 1,
    iconSrc: '/assets/cargo/spare_parts.png',
  },
  {
    id: 'rover_fuel',
    name: 'Extra rover fuel',
    hint: 'This supply helps our outpost rover on the long trip. It takes up cargo space.',
    weight: 2,
    iconSrc: '/assets/cargo/rover_fuel.png',
  },
  {
    id: 'radio_booster',
    name: 'Radio booster',
    hint: 'This makes messages clearer. It cannot make them travel faster.',
    weight: 1,
    iconSrc: '/assets/cargo/radio_booster.png',
  },
];

/** Valid under-budget starting pack for the Balanced button. */
export const BALANCED_PACK: CargoId[] = [
  'batteries',
  'water_recycler',
  'spare_parts',
  'radio_booster',
  'rover_fuel',
];

export const PLAN_COPY = {
  welcome: 'Every rocket has a carrying limit. Choose the supplies you want to bring!',
  tradeoff: 'More of one supply leaves less room for another. What will help your mission?',
  overBudget: 'That pack is too heavy. Remove something before adding this supply.',
  balanced: 'Here is a balanced starting pack. You can change it before launch.',
  launch: 'Your cargo is ready. Let’s begin our Mars mission!',
  alwaysIncluded: 'Habitat, air module, dish and rover are already aboard.',
} as const;

export const SKY_BRIEFING: Record<
  SkyLevel,
  { briefing: string; advice: string }
> = {
  calm: {
    briefing:
      'NASA’s recorded observations give our mission a calm solar setting. We still need to plan our supplies.',
    advice: 'Think about power, water and protection. A quiet setting is a chance to prepare.',
  },
  active: {
    briefing:
      'NASA recorded increased solar activity in our observation window. Our story will include a solar warning.',
    advice: 'Shield plating adds protection. Batteries can help with power use at night.',
  },
  stormy: {
    briefing:
      'NASA’s recorded observations give our mission a stormy solar setting. Our story will test our protection plan.',
    advice: 'Consider shield plating and power supplies. You choose what fits in the cargo.',
  },
};

export const CARGO_BUDGET = BALANCE.cargoBudget;

export function cargoWeight(ids: CargoId[]): number {
  return ids.reduce((sum, id) => {
    const item = PLAN_CARGO.find((c) => c.id === id);
    return sum + (item?.weight ?? 0);
  }, 0);
}
