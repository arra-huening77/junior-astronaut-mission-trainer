import { BALANCE } from './balance';
import { createLoadout } from './loadout';
import { FIXED_EVENT_ORDER } from './schedule';
import type { FrozenSky, GameState } from './types';

/** All external input is injected: no NASA calls, clock lookup or randomness here. */
export function createMission(input: {
  missionDate: string;
  contentVersion: string;
  sky: FrozenSky;
}): GameState {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.missionDate) ||
    new Date(input.missionDate).toISOString().slice(0, 10) !== input.missionDate
  ) {
    throw new RangeError('Mission date must be a valid UTC YYYY-MM-DD date.');
  }
  if (!input.contentVersion.trim())
    throw new TypeError('Content version is required.');
  if (
    !['calm', 'active', 'stormy'].includes(input.sky.level) ||
    !['live', 'cache', 'saved'].includes(input.sky.source) ||
    !Number.isFinite(Date.parse(input.sky.fetchedAt))
  ) {
    throw new TypeError('A validated sky snapshot is required before Plan.');
  }
  return {
    missionDate: input.missionDate,
    contentVersion: input.contentVersion,
    schedule: [...FIXED_EVENT_ORDER],
    solarVariant: input.sky.level,
    sky: structuredClone(input.sky),
    cargo: [],
    modifiers: createLoadout([]),
    sol: 1,
    phase: 'PLAN',
    meters: { ...BALANCE.startMeters },
    science: 0,
    flags: [],
    solarPenalty: 0,
    pending: [],
    history: [],
    albumIds: [],
  };
}
