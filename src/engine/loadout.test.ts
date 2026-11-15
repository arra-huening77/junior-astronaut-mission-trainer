import { describe, expect, it } from 'vitest';
import { createLoadout, getCargoCatalog, validateLoadout } from './loadout';

describe('cargo plans', () => {
  it('accepts an empty plan and the exact ten-point boundary', () => {
    expect(validateLoadout([])).toEqual({ valid: true, weight: 0 });
    const cargo = [
      'solar_extra',
      'shield_plating',
      'batteries',
      'water_recycler',
    ] as const;
    expect(validateLoadout(cargo)).toEqual({ valid: true, weight: 10 });
    expect(createLoadout(cargo)).toEqual({
      solarGain: 15,
      baseLoad: 5,
      lifeUpkeep: 5,
      startBonus: { shield: 20, life: 10 },
    });
  });

  it('rejects overweight, unknown and duplicate packages instead of stacking upgrades', () => {
    const all = getCargoCatalog().map((item) => item.id);
    expect(validateLoadout(all)).toEqual({
      valid: false,
      reason: 'over_budget',
      weight: 17,
    });
    expect(validateLoadout(['batteries', 'batteries'])).toMatchObject({
      valid: false,
      reason: 'duplicate',
    });
    expect(validateLoadout(['not_a_package'])).toMatchObject({
      valid: false,
      reason: 'unknown',
    });
    expect(() => createLoadout(['solar_extra', 'solar_extra'])).toThrow(
      RangeError,
    );
    expect(() => createLoadout(all)).toThrow(RangeError);
  });

  it('does not turn conditional repair supplies into passive generation or starting power', () => {
    expect(
      createLoadout(['spare_parts', 'rover_fuel', 'radio_booster']),
    ).toEqual(createLoadout([]));
    expect(createLoadout(['greenhouse_kit']).lifeUpkeep).toBe(3);
  });

  it('protects the private catalog from edits to a returned UI copy', () => {
    getCargoCatalog()[0].weight = 0;
    expect(validateLoadout(['solar_extra'])).toEqual({
      valid: true,
      weight: 3,
    });
  });
});
