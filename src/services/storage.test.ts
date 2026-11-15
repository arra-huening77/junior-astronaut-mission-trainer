import { describe, expect, it } from 'vitest';
import { createMission } from '../engine/state';
import { createRetrySession } from '../engine/retry';
import { readSave } from '../engine/save-validation';
import {
  beginNextSol,
  encounterRealMoment,
  finishNight,
  launchMission,
  resolveChoice,
} from '../engine/resources';
import type { SaveEnvelope } from '../engine/contracts';
import type { GameState, Sol } from '../engine/types';
import {
  createMissionStorage,
  createSaveEnvelope,
  MISSION_STORAGE_KEYS,
} from './storage';
import type { StorageAdapter } from './storage';

const VERSION = 'storage-test';
const SAVED_AT = '2026-11-14T05:00:00.000Z';

function adapter(): StorageAdapter & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

/** Development-only fixture; no actual NASA event or source is fabricated. */
function start(): GameState {
  return launchMission(
    createMission({
      missionDate: '2026-11-14',
      contentVersion: VERSION,
      sky: { level: 'active', source: 'saved', fetchedAt: SAVED_AT },
    }),
    ['solar_extra', 'batteries', 'spare_parts', 'greenhouse_kit'],
  );
}

function chooseA(state: GameState): GameState {
  return resolveChoice({ ...state, phase: 'CHOICE' }, 'A').state;
}

function night(state: GameState): GameState {
  return finishNight(encounterRealMoment(state, `test-card-${state.sol}`));
}

function atSol(sol: Sol): GameState {
  let state = start();
  while (state.sol < sol) state = beginNextSol(night(chooseA(state)));
  return state;
}

function envelope(
  state = start(),
  overrides: Partial<SaveEnvelope> = {},
): SaveEnvelope {
  return {
    ...createSaveEnvelope({
      runId: 'test-run-one',
      state,
      checkpoint: 'sol_start',
      savedAt: SAVED_AT,
    }),
    ...overrides,
  };
}

function requireActive(
  store: ReturnType<typeof createMissionStorage>,
): SaveEnvelope {
  const result = store.loadActive();
  expect(result.kind).toBe('ready');
  if (result.kind !== 'ready') throw new Error('Expected active test mission');
  return result.save;
}

describe('durable save validation', () => {
  it('preserves valid minute-resolution DONKI timestamps without inventing seconds', () => {
    const state = start();
    state.sky!.observedAt = '2026-11-14T04:30Z';
    const value = readSave(JSON.stringify(envelope(state)), {
      contentVersion: VERSION,
    });
    expect(value).toMatchObject({
      kind: 'ready',
      save: { state: { sky: { observedAt: '2026-11-14T04:30Z' } } },
    });
  });
  it('round-trips the frozen run without new generation, cargo changes or input mutation', () => {
    const disk = adapter();
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: disk,
    });
    const original = envelope();
    expect(store.save(original)).toEqual({ kind: 'saved', mode: 'persistent' });
    const reopened = createMissionStorage({
      contentVersion: VERSION,
      storage: disk,
    });
    const restored = requireActive(reopened);
    expect(restored).toEqual(original);
    expect(launchMission(restored.state, [])).toEqual(original.state);
    expect(beginNextSol(restored.state)).toEqual(original.state);
    restored.state.meters.power = 0;
    expect(requireActive(reopened).state.meters.power).toBe(80);
  });

  it.each(['{broken-json', 'null', '[]'])(
    'handles corrupt stored value %s without throwing',
    (input) => {
      const disk = adapter();
      disk.values.set(MISSION_STORAGE_KEYS.active, input);
      expect(
        createMissionStorage({
          contentVersion: VERSION,
          storage: disk,
        }).loadActive(),
      ).toEqual({ kind: 'invalid' });
    },
  );

  it('rejects schema/content mismatches rather than silently migrating', () => {
    expect(
      readSave(JSON.stringify({ ...envelope(), schemaVersion: 99 }), {
        contentVersion: VERSION,
      }),
    ).toEqual({ kind: 'incompatible' });
    expect(
      readSave(JSON.stringify(envelope()), {
        contentVersion: 'different-story',
      }),
    ).toEqual({ kind: 'incompatible' });
  });

  it.each([
    (value: SaveEnvelope) => {
      value.state.meters.power = 101;
    },
    (value: SaveEnvelope) => {
      value.state.cargo.push('solar_extra');
    },
    (value: SaveEnvelope) => {
      value.state.schedule.reverse();
    },
    (value: SaveEnvelope) => {
      value.state.solarVariant = 'stormy';
    },
    (value: SaveEnvelope) => {
      value.state.modifiers.solarGain = 999;
    },
    (value: SaveEnvelope) => {
      value.state.history.push({
        sol: 1,
        eventId: 'finale',
        choiceId: 'A',
        meters: { life: 50, power: 50, shield: 50 },
      });
    },
    (value: SaveEnvelope) => {
      value.state.flags.push('quickPatch');
    },
    (value: SaveEnvelope) => {
      value.state.pending.push({ appliesAtSol: 1, effects: { power: -5 } });
    },
    (value: SaveEnvelope) => {
      value.state.sky!.sourceUrl = 'javascript:alert(1)';
    },
    (value: SaveEnvelope) => {
      Object.assign(value.state, { GEMINI_API_KEY: 'must-not-be-saved' });
    },
  ])(
    'rejects corrupt IDs/ranges/metadata and unknown fields (%#)',
    (corrupt) => {
      const save = envelope();
      corrupt(save);
      expect(
        readSave(JSON.stringify(save), { contentVersion: VERSION }),
      ).toEqual({ kind: 'invalid' });
    },
  );

  it('requires a cursor for transient walking and validates scene steps when a registry is supplied', () => {
    const save = envelope({ ...start(), phase: 'WALKING' });
    expect(
      readSave(JSON.stringify(save), { contentVersion: VERSION }).kind,
    ).toBe('invalid');
    save.cursor = { eventId: 'touchdown', stepId: 'walk-habitat' };
    expect(
      readSave(JSON.stringify(save), {
        contentVersion: VERSION,
        isKnownCursor: () => false,
      }).kind,
    ).toBe('invalid');
    expect(
      readSave(JSON.stringify(save), {
        contentVersion: VERSION,
        isKnownCursor: (cursor) => cursor.stepId === 'walk-habitat',
      }).kind,
    ).toBe('ready');
  });
});

describe('checkpoint resume', () => {
  it('restores walking to target selection without repeating sol-start effects', () => {
    const disk = adapter();
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: disk,
    });
    const walking = envelope(
      { ...start(), phase: 'WALKING' },
      { cursor: { eventId: 'touchdown', stepId: 'walk-habitat' } },
    );
    expect(store.save(walking).kind).toBe('saved');
    const restored = requireActive(
      createMissionStorage({ contentVersion: VERSION, storage: disk }),
    );
    expect(restored.state.phase).toBe('WALK_SELECT');
    expect(restored.state.meters).toEqual(walking.state.meters);
    expect(restored.state.sky).toEqual(walking.state.sky);
  });

  it('restarts an uncommitted mini-game with the same choice and only one eventual bonus/cost', () => {
    const disk = adapter();
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: disk,
    });
    const waiting = { ...atSol(3), phase: 'MINIGAME' } as GameState;
    const save = envelope(waiting, {
      cursor: {
        eventId: 'dust_storm',
        stepId: 'cover-task',
        selectedChoiceId: 'A',
        miniGameResult: 'done',
      },
    });
    expect(store.save(save).kind).toBe('saved');
    const restored = requireActive(
      createMissionStorage({ contentVersion: VERSION, storage: disk }),
    );
    expect(restored.cursor?.selectedChoiceId).toBe('A');
    expect(restored.cursor?.miniGameResult).toBeUndefined();
    expect(restored.state.history).toHaveLength(2);
    const committed = resolveChoice(restored.state, 'A', 'done').state;
    expect(committed.meters.power).toBe(waiting.meters.power - 8);
    expect(
      store.save(envelope(committed, { checkpoint: 'choice_result' })).kind,
    ).toBe('saved');
    const reloaded = requireActive(
      createMissionStorage({ contentVersion: VERSION, storage: disk }),
    ).state;
    expect(resolveChoice(reloaded, 'A', 'done').state).toEqual(committed);
    expect(reloaded.pending).toHaveLength(1);
  });

  it('does not charge saved night upkeep twice or repeat the delayed dust cost', () => {
    const disk = adapter();
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: disk,
    });
    const afterNight = night(chooseA(atSol(3)));
    expect(store.save(envelope(afterNight, { checkpoint: 'night' })).kind).toBe(
      'saved',
    );
    const restored = requireActive(
      createMissionStorage({ contentVersion: VERSION, storage: disk }),
    ).state;
    expect(finishNight(restored)).toEqual(afterNight);
    const next = beginNextSol(restored);
    expect(next.meters.power).toBe(afterNight.meters.power - 5 + 15);
    expect(next.pending).toEqual([]);
    expect(store.save(envelope(next)).kind).toBe('saved');
    const resumedNext = requireActive(
      createMissionStorage({ contentVersion: VERSION, storage: disk }),
    ).state;
    expect(beginNextSol(resumedNext)).toEqual(next);
  });

  it('retains a completed report and removes unfinished Continue without blocking the ending', () => {
    const disk = adapter();
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: disk,
    });
    expect(store.save(envelope()).kind).toBe('saved');
    const ended = night(chooseA(atSol(10)));
    expect(ended.ending).toBe('success');
    expect(store.save(envelope(ended, { checkpoint: 'ending' })).kind).toBe(
      'saved',
    );
    expect(store.loadActive()).toEqual({ kind: 'empty' });
    expect(store.loadLastRun()).toMatchObject({
      kind: 'ready',
      save: { state: { ending: 'success' } },
    });
    expect(disk.values.has(MISSION_STORAGE_KEYS.active)).toBe(false);
  });

  it('requires confirmation before replacing another unfinished run', () => {
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: adapter(),
    });
    expect(store.save(envelope()).kind).toBe('saved');
    const replacement = envelope(start(), { runId: 'second-run' });
    expect(store.save(replacement)).toEqual({
      kind: 'confirmation_required',
      currentRunId: 'test-run-one',
    });
    expect(requireActive(store).runId).toBe('test-run-one');
    expect(store.save(replacement, { replaceUnfinished: true }).kind).toBe(
      'saved',
    );
    expect(requireActive(store).runId).toBe('second-run');
  });
});

describe('memory fallback and retry', () => {
  it('rejects older autosave checkpoints instead of rewinding committed progress', () => {
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: adapter(),
    });
    const initial = envelope();
    store.save(initial);
    const result = chooseA(initial.state);
    store.save(envelope(result, { checkpoint: 'choice_result' }));
    expect(store.save(initial)).toEqual({ kind: 'stale' });
    expect(requireActive(store).state.history).toHaveLength(1);
  });

  it('persists an explicit sol retry without the old failure report hiding Continue', () => {
    const disk = adapter();
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: disk,
    });
    const session = createRetrySession();
    const initial = start();
    session.capture('test-run-one', initial, {
      eventId: 'touchdown',
      stepId: 'entry',
    });
    const failed = resolveChoice(
      { ...initial, phase: 'CHOICE', meters: { ...initial.meters, power: 4 } },
      'A',
    ).state;
    expect(store.save(envelope(failed, { checkpoint: 'ending' })).kind).toBe(
      'saved',
    );
    const retry = session.restore('test-run-one', failed)!;
    expect(store.save(envelope(retry.state, { cursor: retry.cursor }))).toEqual(
      { kind: 'stale' },
    );
    expect(
      store.save(envelope(retry.state, { cursor: retry.cursor }), {
        retrySol: true,
      }),
    ).toEqual({ kind: 'saved', mode: 'persistent' });
    const restored = requireActive(
      createMissionStorage({ contentVersion: VERSION, storage: disk }),
    );
    expect(restored.state).toEqual(initial);
    expect(restored.cursor?.stepId).toBe('entry');
  });
  it('keeps progress after read/write exceptions and reports session-only storage', () => {
    const broken: StorageAdapter = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
      removeItem() {
        throw new Error('blocked');
      },
    };
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: broken,
    });
    expect(store.loadActive()).toEqual({ kind: 'empty' });
    expect(store.mode).toBe('memory');
    expect(store.save(envelope())).toEqual({ kind: 'saved', mode: 'memory' });
    expect(requireActive(store).state).toEqual(start());
    expect(
      createMissionStorage({
        contentVersion: VERSION,
        storage: broken,
      }).loadActive(),
    ).toEqual({ kind: 'empty' });
  });

  it('survives quota failure without reverting to an older durable checkpoint', () => {
    const disk = adapter();
    disk.values.set(MISSION_STORAGE_KEYS.active, JSON.stringify(envelope()));
    disk.setItem = () => {
      throw new Error('quota');
    };
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: disk,
    });
    const result = chooseA(start());
    expect(
      store.save(envelope(result, { checkpoint: 'choice_result' })),
    ).toEqual({ kind: 'saved', mode: 'memory' });
    expect(requireActive(store).state.history).toHaveLength(1);
    store.clearActive();
    expect(store.loadActive()).toEqual({ kind: 'empty' });
  });

  it('hides a stale unfinished save when the same completed report was persisted before removal failed', () => {
    const disk = adapter();
    const store = createMissionStorage({
      contentVersion: VERSION,
      storage: disk,
    });
    store.save(envelope());
    disk.removeItem = () => {
      throw new Error('remove blocked');
    };
    const ended = night(chooseA(atSol(10)));
    expect(store.save(envelope(ended, { checkpoint: 'ending' }))).toEqual({
      kind: 'saved',
      mode: 'memory',
    });
    expect(
      createMissionStorage({
        contentVersion: VERSION,
        storage: disk,
      }).loadActive(),
    ).toEqual({ kind: 'empty' });
  });

  it('restores only the captured run/sol after gentle failure, retaining cargo and frozen sky', () => {
    const session = createRetrySession();
    const initial = start();
    session.capture('run-one', initial, {
      eventId: 'touchdown',
      stepId: 'entry',
    });
    const failed = resolveChoice(
      { ...initial, phase: 'CHOICE', meters: { ...initial.meters, power: 4 } },
      'A',
    ).state;
    const snapshot = session.restore('run-one', failed);
    expect(snapshot?.state).toEqual(initial);
    expect(snapshot?.state.phase).toBe('BRIEFING');
    expect(snapshot?.state.sky).toEqual(initial.sky);
    expect(session.restore('wrong-run', failed)).toBeUndefined();
    expect(session.restore('run-one', { ...failed, sol: 2 })).toBeUndefined();
    expect(
      session.restore('run-one', { ...failed, ending: 'success' }),
    ).toBeUndefined();
    snapshot!.state.meters.power = 0;
    expect(session.restore('run-one', failed)?.state.meters.power).toBe(80);
    expect(createRetrySession().restore('run-one', failed)).toBeUndefined();
    session.clear();
    expect(session.restore('run-one', failed)).toBeUndefined();
  });
});
