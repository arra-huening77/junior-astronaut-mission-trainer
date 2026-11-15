import { describe, expect, it } from 'vitest';
import { eventForSol, FIXED_EVENT_ORDER } from './schedule';
import type { FlagId } from './types';

describe('fixed mission routing', () => {
  it('changes only Sol 8 after a quick patch without mutating flags or the default order', () => {
    const flags: readonly FlagId[] = Object.freeze(['quickPatch']);
    const defaultRun = Array.from({ length: 10 }, (_, index) =>
      eventForSol(index + 1, []),
    );
    const leakRun = Array.from({ length: 10 }, (_, index) =>
      eventForSol(index + 1, flags),
    );
    expect(defaultRun).toEqual(FIXED_EVENT_ORDER);
    expect(leakRun.filter((id, index) => id !== defaultRun[index])).toEqual([
      'leak',
    ]);
    expect(leakRun[7]).toBe('leak');
    expect(defaultRun[7]).toBe('meteors');
    expect(flags).toEqual(['quickPatch']);
    expect(FIXED_EVENT_ORDER[7]).toBe('meteors');
  });

  it('does not let other flags reorder the mission', () => {
    const flags: FlagId[] = [
      'ignoredFlicker',
      'usedBackupO2',
      'plantsSuffered',
      'usedReserve',
    ];
    expect(
      Array.from({ length: 10 }, (_, index) => eventForSol(index + 1, flags)),
    ).toEqual(FIXED_EVENT_ORDER);
  });

  it.each([0, -1, 11, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid sol %s instead of returning an undefined scene',
    (sol) => {
      expect(() => eventForSol(sol, [])).toThrow(RangeError);
    },
  );
});
