import { describe, expect, it } from 'vitest';
import { createMission } from './state';
import { getEventRules, parseEventRules, rulesForSky } from './rules';
import { eventForSol } from './schedule';
import {
  beginNextSol,
  encounterRealMoment,
  failedMeter,
  finishNight,
  launchMission,
  meterZone,
  previewChoice,
  resolveChoice,
} from './resources';
import type {
  CargoId,
  ChoiceId,
  FrozenSky,
  GameState,
  SkyLevel,
  Sol,
} from './types';

/** Test-only snapshot. No fixture observations are shipped or presented as NASA data. */
function plan(level: SkyLevel = 'calm'): GameState {
  return createMission({
    missionDate: '2026-11-14',
    contentVersion: 'engine-test',
    sky: { level, source: 'saved', fetchedAt: '2026-11-14T00:00:00.000Z' },
  });
}

function choiceState(sol: Sol = 1, level: SkyLevel = 'calm'): GameState {
  return {
    ...launchMission(plan(level), []),
    sol,
    phase: 'CHOICE',
    meters: { life: 50, power: 50, shield: 50 },
    flags: sol === 8 ? ['quickPatch'] : [],
  };
}

function nightAfter(state: GameState): GameState {
  return finishNight(encounterRealMoment(state, `test-card-${state.sol}`));
}

describe('launch', () => {
  it('keeps starting bonuses separate from generation and commits both once', () => {
    const initial = plan();
    const normal = launchMission(initial, []);
    const upgraded = launchMission(initial, [
      'solar_extra',
      'shield_plating',
      'water_recycler',
    ]);
    expect(initial.meters).toEqual({ life: 80, power: 65, shield: 60 });
    expect(normal.meters).toEqual({ life: 80, power: 77, shield: 60 });
    expect(upgraded.meters).toEqual({ life: 90, power: 80, shield: 80 });
    expect(launchMission(upgraded, ['batteries'])).toBe(upgraded);
    expect(upgraded.cargo).toEqual([
      'solar_extra',
      'shield_plating',
      'water_recycler',
    ]);
  });

  it('copies caller-owned cargo and sky data so later edits cannot change the run', () => {
    const sky: FrozenSky = {
      level: 'active',
      source: 'saved',
      fetchedAt: '2026-11-14T00:00:00Z',
    };
    const initial = createMission({
      missionDate: '2026-11-14',
      contentVersion: 'test',
      sky,
    });
    const cargo: CargoId[] = ['solar_extra'];
    const launched = launchMission(initial, cargo);
    sky.level = 'stormy';
    cargo.push('batteries');
    expect(launched.solarVariant).toBe('active');
    expect(launched.sky?.level).toBe('active');
    expect(launched.cargo).toEqual(['solar_extra']);
  });

  it.each(['2026-02-31', '2026-13-01', 'not-a-date'])(
    'rejects invalid mission date %s',
    (missionDate) => {
      expect(() =>
        createMission({
          missionDate,
          contentVersion: 'test',
          sky: plan().sky!,
        }),
      ).toThrow(RangeError);
    },
  );
});

describe('choice resolution', () => {
  it('does not mutate the input or charge a duplicate result/bonus twice', () => {
    const input = choiceState(3);
    const before = structuredClone(input);
    const committed = resolveChoice(input, 'A', 'done');
    expect(committed.state.meters.power).toBe(42);
    expect(input).toEqual(before);
    expect(resolveChoice(committed.state, 'A', 'done')).toEqual({
      state: committed.state,
      result: null,
    });
    const stalePhase: GameState = { ...committed.state, phase: 'CHOICE' };
    expect(resolveChoice(stalePhase, 'A', 'done').state).toBe(stalePhase);
    expect(committed.state.history).toHaveLength(1);
    expect(committed.state.pending).toHaveLength(1);
  });

  it('uses the same base cost for skipping and awards Rover Drive Life, not Power', () => {
    const input = choiceState(4);
    const done = resolveChoice(input, 'A', 'done').state;
    const skipped = resolveChoice(input, 'A', 'skipped').state;
    expect(done.meters).toEqual({ life: 60, power: 45, shield: 50 });
    expect(skipped.meters).toEqual({ life: 58, power: 45, shield: 50 });
    expect(done.history[0].miniGame).toBe('done');
    expect(skipped.history[0].miniGame).toBe('skipped');
  });

  it('rejects fabricated game completion and incomplete active-task results', () => {
    expect(() => resolveChoice(choiceState(), 'A', 'done')).toThrow(TypeError);
    expect(() =>
      resolveChoice({ ...choiceState(3), phase: 'MINIGAME' }, 'A'),
    ).toThrow(TypeError);
  });

  it.each([
    ['calm', 46, 56],
    ['active', 40, 64],
    ['stormy', 35, 70],
  ] as const)(
    'replaces the solar reference with %s effects instead of stacking them',
    (level, power, shield) => {
      const resolved = resolveChoice(choiceState(6, level), 'A');
      expect(resolved.state.meters).toEqual({ life: 50, power, shield });
      expect(resolved.result?.afterKey).toBe(`solar_storm.${level}.A.after`);
    },
  );

  it('does not apply solar severity to the authored dust event', () => {
    expect(resolveChoice(choiceState(3, 'calm'), 'A').state.meters).toEqual(
      resolveChoice(choiceState(3, 'stormy'), 'A').state.meters,
    );
  });

  it('combines the flicker penalty, spare parts and repair bonus exactly once', () => {
    const input = {
      ...choiceState(7),
      cargo: ['spare_parts'] as CargoId[],
      flags: ['ignoredFlicker'] as GameState['flags'],
    };
    expect(resolveChoice(input, 'A', 'done').state.meters.power).toBe(37);
    const patched = resolveChoice(input, 'B').state;
    expect(patched.meters.power).toBe(44);
    expect(patched.flags).toContain('quickPatch');
    expect(eventForSol(8, patched.flags)).toBe('leak');
  });

  it('applies rover fuel only to the long trip and the radio boost only to waiting for Earth', () => {
    const ice = { ...choiceState(4), cargo: ['rover_fuel'] as CargoId[] };
    expect(resolveChoice(ice, 'B', 'done').state.meters).toEqual({
      life: 70,
      power: 40,
      shield: 45,
    });
    expect(resolveChoice(ice, 'A').state.meters.power).toBe(45);
    const radio = { ...choiceState(5), cargo: ['radio_booster'] as CargoId[] };
    expect(resolveChoice(radio, 'A').state.meters.power).toBe(50);
    expect(resolveChoice(radio, 'B').state.meters.power).toBe(40);
  });

  it('preserves existing Science on a research pause and applies leak C as +3, not an extra -2', () => {
    const input = {
      ...choiceState(8),
      science: 6,
      meters: { life: 10, power: 50, shield: 50 },
    };
    const result = resolveChoice(input, 'C').state;
    expect(result.meters.life).toBe(13);
    const night = nightAfter(result);
    expect(night.meters.life).toBe(8);
    expect(night.science).toBe(6);
  });

  it('treats a zero finale delta as no change, never setting that meter to zero', () => {
    expect(resolveChoice(choiceState(10), 'B').state.meters.life).toBe(50);
    expect(resolveChoice(choiceState(10), 'C').state.meters.shield).toBe(50);
  });

  it('clamps output meters and preserves the caller during a risky-choice preview', () => {
    const input = {
      ...choiceState(1),
      meters: { life: 99, power: 4, shield: 60 },
    };
    const copy = structuredClone(input);
    expect(previewChoice(input, 'A')).toEqual({
      meters: { life: 100, power: 0, shield: 60 },
      failedMeter: 'power',
    });
    expect(input).toEqual(copy);
    expect(resolveChoice(input, 'A').state).toMatchObject({
      phase: 'ENDED',
      ending: 'gentle',
      failedMeter: 'power',
    });
  });
});

describe('night and the next sol', () => {
  it('charges night once and does not add the same encountered card twice', () => {
    const result = resolveChoice(choiceState(), 'A').state;
    expect(finishNight(result)).toBe(result);
    const card = encounterRealMoment(result, 'test-card');
    expect(encounterRealMoment(card, 'test-card')).toBe(card);
    const night = finishNight(card);
    expect(night.meters).toEqual({ life: 50, power: 37, shield: 50 });
    expect(finishNight(night)).toBe(night);
    const next = beginNextSol(night);
    expect(next.sol).toBe(2);
    expect(next.meters.power).toBe(49);
    expect(beginNextSol(next)).toBe(next);
    expect(next.albumIds).toEqual(['test-card']);
  });

  it('consumes the dust consequence on the next sol and never repeats it', () => {
    const result = resolveChoice(choiceState(3), 'A', 'skipped').state;
    const next = beginNextSol(nightAfter(result));
    expect(next.sol).toBe(4);
    expect(next.meters.power).toBe(39); // 50 - 10 - 8 - 5 + 12
    expect(next.pending).toEqual([]);
    expect(beginNextSol(next)).toBe(next);
  });

  it('combines pending costs and generation before clamping the sol-start total', () => {
    const input: GameState = {
      ...choiceState(3),
      phase: 'NIGHT',
      meters: { life: 50, power: 5, shield: 50 },
      pending: [{ appliesAtSol: 4, effects: { power: -15 } }],
    };
    expect(beginNextSol(input).meters.power).toBe(2);
  });

  it('carries backup-panel generation loss into later sols', () => {
    const result = resolveChoice(choiceState(7), 'C').state;
    const next = beginNextSol(nightAfter(result));
    expect(next.solarPenalty).toBe(5);
    expect(next.meters.power).toBe(41); // 50 - 8 - 8 + 12 - 5
  });

  it('applies the plants consequence once on Sol 10 without deleting its reporting flag', () => {
    const result = resolveChoice(choiceState(9), 'C').state;
    const next = beginNextSol(nightAfter(result));
    expect(next.sol).toBe(10);
    expect(next.meters.life).toBe(37); // 50 - 5 - 5 - 3
    expect(next.flags).toContain('plantsSuffered');
    expect(beginNextSol(next)).toBe(next);
  });

  it('blocks card/night progression after immediate choice failure', () => {
    const state = resolveChoice(
      { ...choiceState(), meters: { life: 50, power: 4, shield: 50 } },
      'A',
    ).state;
    expect(encounterRealMoment(state, 'test-card')).toBe(state);
    expect(finishNight(state)).toBe(state);
    expect(beginNextSol(state)).toBe(state);
    expect(state.albumIds).toEqual([]);
  });

  it('checks final-night failure before success and never advances to Sol 11', () => {
    const input: GameState = {
      ...choiceState(10),
      phase: 'REAL_CARD',
      meters: { life: 5, power: 30, shield: 20 },
    };
    const failed = finishNight(input);
    expect(failed).toMatchObject({
      phase: 'ENDED',
      ending: 'gentle',
      failedMeter: 'life',
    });
    const success = finishNight({
      ...input,
      meters: { life: 6, power: 9, shield: 1 },
    });
    expect(success).toMatchObject({
      phase: 'ENDED',
      ending: 'success',
      meters: { life: 1, power: 1, shield: 1 },
    });
    expect(beginNextSol(success)).toBe(success);
  });
});

describe('failure and content boundaries', () => {
  it('uses the largest actual drop for simultaneous failures and a deterministic tie order', () => {
    expect(
      failedMeter(
        { life: 2, power: 8, shield: 50 },
        { life: 0, power: 0, shield: 50 },
      ),
    ).toBe('power');
    expect(
      failedMeter(
        { life: 5, power: 5, shield: 50 },
        { life: 0, power: 0, shield: 50 },
      ),
    ).toBe('life');
  });

  it.each([
    [31, 'ok'],
    [30, 'low'],
    [15, 'danger'],
    [0, 'empty'],
  ] as const)('labels meter value %s as %s', (value, zone) => {
    expect(meterZone(value)).toBe(zone);
  });

  it('rejects incomplete solar variants and misspelled effects rather than using invented defaults', () => {
    const solar = getEventRules('solar_storm');
    expect(() => parseEventRules({ ...solar, variants: {} })).toThrow(
      TypeError,
    );
    const event = getEventRules('touchdown');
    expect(() =>
      parseEventRules({
        ...event,
        choices: [
          { ...event.choices[0], effects: { powre: -5 } },
          ...event.choices.slice(1),
        ],
      }),
    ).toThrow(TypeError);
    expect(rulesForSky(solar, 'calm').choices[0].effects).toEqual({
      power: -4,
      shield: 6,
    });
  });
});

describe('whole-mission engine scenarios', () => {
  it('completes the leak route with flicker and plant callbacks and records the resolved schedule', () => {
    let state = launchMission(plan('active'), [
      'solar_extra',
      'batteries',
      'spare_parts',
      'greenhouse_kit',
    ]);
    for (let index = 1; index <= 10; index++) {
      const choiceId: ChoiceId =
        index === 5 || index === 8 || index === 9
          ? 'C'
          : index === 7
            ? 'B'
            : 'A';
      state = { ...state, phase: 'CHOICE' };
      const choice = rulesForSky(
        getEventRules(eventForSol(state.sol, state.flags)),
        state.solarVariant,
      ).choices.find((item) => item.id === choiceId)!;
      state = resolveChoice(
        state,
        choiceId,
        choice.miniGame ? 'done' : undefined,
      ).state;
      state = nightAfter(state);
      if (index < 10) state = beginNextSol(state);
    }
    expect(state.ending).toBe('success');
    expect(state.history[7].eventId).toBe('leak');
    expect(state.schedule[7]).toBe('leak');
    expect(state.flags).toEqual(
      expect.arrayContaining([
        'ignoredFlicker',
        'quickPatch',
        'plantsSuffered',
      ]),
    );
    expect(state.science).toBe(2);
    expect(state.meters.life).toBe(58);
  });
  it.each(['calm', 'active', 'stormy'] as const)(
    'can complete a fixed ten-sol %s mission with an authored viable loadout',
    (level) => {
      let state = launchMission(plan(level), [
        'solar_extra',
        'batteries',
        'spare_parts',
        'greenhouse_kit',
      ]);
      for (let index = 1; index <= 10; index++) {
        expect(state.sol).toBe(index);
        state = { ...state, phase: 'CHOICE' };
        const choiceId: ChoiceId = 'A';
        const choice = rulesForSky(
          getEventRules(eventForSol(state.sol, state.flags)),
          state.solarVariant,
        ).choices[0];
        state = resolveChoice(
          state,
          choiceId,
          choice.miniGame ? 'done' : undefined,
        ).state;
        expect(state.ending).toBeUndefined();
        state = nightAfter(state);
        if (index < 10) state = beginNextSol(state);
      }
      expect(state).toMatchObject({
        sol: 10,
        phase: 'ENDED',
        ending: 'success',
        solarVariant: level,
      });
      expect(state.history).toHaveLength(10);
      expect(state.albumIds).toHaveLength(10);
      expect(state.history[7].eventId).toBe('meteors');
      expect(
        Object.values(state.meters).every((value) => value > 0 && value <= 100),
      ).toBe(true);
    },
  );
});
