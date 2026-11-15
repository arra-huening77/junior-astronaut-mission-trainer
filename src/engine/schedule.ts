import type { EventId, FlagId } from './types';

/** Sol 8's default is meteors; resolve it after the earlier repair choice. */
export const FIXED_EVENT_ORDER = [
  'touchdown',
  'first_night',
  'dust_storm',
  'ice_hunt',
  'calling_earth',
  'solar_storm',
  'equipment_failure',
  'meteors',
  'cold_night',
  'finale',
] as const satisfies readonly EventId[];

export function eventForSol(sol: number, flags: readonly FlagId[]): EventId {
  if (!Number.isInteger(sol) || sol < 1 || sol > FIXED_EVENT_ORDER.length) {
    throw new RangeError('A mission sol must be an integer from 1 to 10.');
  }
  if (sol === 8 && flags.includes('quickPatch')) return 'leak';
  return FIXED_EVENT_ORDER[sol - 1];
}
