import { describe, expect, it } from 'vitest';
import copy from '../../content/sol08-leak-or-meteors.json';
import { createMission } from '../state';
import {
  beginNextSol,
  encounterRealMoment,
  finishNight,
  launchMission,
  resolveChoice,
} from '../resources';
import { createSceneRegistry, validateScene } from '../scene-registry';
import {
  resumeScene,
  sceneView,
  sendSceneInput,
  startScene,
} from '../scene-player';
import type { SceneTransition } from '../scene-player';
import type { SceneDefinition } from '../scene-types';
import { getEventRules } from '../rules';
import { createSaveEnvelope } from '../../services/storage';
import type { ChoiceId, GameState } from '../types';
import { createSol08Scene } from './sol08-leak-or-meteors';

// Test-only snapshot; reach Sol 8 through actual fixed-order engine transitions.
function sol8(repair: ChoiceId, greenhouse = false): GameState {
  let game = launchMission(
    createMission({
      missionDate: '2026-11-14',
      contentVersion: 'sol8-test',
      sky: {
        level: 'calm',
        source: 'saved',
        fetchedAt: '2026-11-14T00:00:00Z',
      },
    }),
    greenhouse ? ['greenhouse_kit'] : [],
  );
  const choices: ChoiceId[] = ['A', 'B', 'A', 'A', 'C', 'B', repair];
  for (const choice of choices) {
    game.phase = 'CHOICE';
    game = beginNextSol(
      finishNight(
        encounterRealMoment(
          resolveChoice(game, choice).state,
          `test-card-${game.sol}`,
        ),
      ),
    );
  }
  return game;
}
function ready(scene: SceneDefinition, game: GameState): SceneTransition {
  let t = startScene(scene, game);
  for (let n = 0; n < scene.steps.length; n++) {
    const step = sceneView(scene, t.playback)!.step;
    if (step.type === 'choice') return t;
    t = sendSceneInput(
      scene,
      t.playback,
      step.type === 'walk'
        ? { type: 'select_spot', stepId: step.id, spotId: 'air' }
        : { type: 'advance', stepId: step.id },
      { reduceMotion: true },
    );
  }
  throw new Error('Sol 8 choice not reached');
}
function advance(
  scene: SceneDefinition,
  t: SceneTransition,
  classroomMode = false,
) {
  return sendSceneInput(
    scene,
    t.playback,
    { type: 'advance', stepId: t.playback.cursor.stepId },
    { classroomMode },
  );
}
function choose(
  scene: SceneDefinition,
  t: SceneTransition,
  choiceId: ChoiceId,
  miniGames = false,
) {
  return sendSceneInput(
    scene,
    t.playback,
    { type: 'choose', stepId: t.playback.cursor.stepId, choiceId },
    { miniGames },
  );
}
const deltas = {
  leak: {
    A: { life: 0, power: -10, shield: 0, science: 0 },
    B: { life: 10, power: -3, shield: 0, science: 0 },
    C: { life: 3, power: 0, shield: 0, science: 0 },
  },
  meteors: {
    A: { life: 0, power: 0, shield: 0, science: 0 },
    B: { life: 0, power: -10, shield: 10, science: 0 },
    C: { life: -5, power: 0, shield: 0, science: 1 },
  },
} as const;

describe('Sol 8 leak or meteors', () => {
  it('uses the Sol 7 repair flag to choose one fixed slot, independent of the solar level', () => {
    const registry = createSceneRegistry([
      createSol08Scene(),
      createSol08Scene(['quickPatch']),
    ]);
    for (const repair of ['A', 'B', 'C'] as const) {
      const game = sol8(repair);
      for (const solarVariant of ['calm', 'active', 'stormy'] as const) {
        const scene = registry.resolve({ ...game, solarVariant });
        expect(scene.eventId).toBe(repair === 'B' ? 'leak' : 'meteors');
        expect(scene.sol).toBe(8);
      }
    }
  });
  it.each([false, true])(
    'validates branch quickPatch=%s with complete authored text',
    (leak) => {
      const scene = createSol08Scene(leak ? ['quickPatch'] : []);
      expect(() => validateScene(scene)).not.toThrow();
      expect(scene.steps.filter((s) => s.type === 'walk')).toEqual(
        leak ? [expect.objectContaining({ target: 'air' })] : [],
      );
      expect(scene.steps.filter((s) => s.type === 'mini_game')).toEqual(
        leak ? [expect.objectContaining({ gameId: 'patch_leak' })] : [],
      );
      const keys = scene.steps.flatMap((s) =>
        'textKey' in s
          ? [s.textKey]
          : 'questionKey' in s
            ? [s.questionKey]
            : [],
      );
      keys.push(
        ...getEventRules(scene.eventId).choices.flatMap((c) => [
          c.labelKey,
          c.afterKey,
        ]),
      );
      for (const key of keys) {
        expect(Object.hasOwn(copy, key), key).toBe(true);
        expect((copy as Record<string, string>)[key]).not.toMatch(
          /\[(?:DATA|CHECK)/,
        );
      }
    },
  );

  for (const leak of [false, true])
    for (const greenhouse of [false, true])
      for (const choiceId of ['A', 'B', 'C'] as const) {
        it(`${leak ? 'leak' : 'meteors'} / ${choiceId}, greenhouse=${greenhouse}: one result and one night`, () => {
          const game = sol8(leak ? 'B' : 'A', greenhouse),
            original = structuredClone(game);
          const scene = createSol08Scene(game.flags),
            t = ready(scene, game);
          // The drip/shake/other presentation cues must never drain resources by themselves.
          expect(t.playback.game.meters).toEqual(game.meters);
          const result = choose(scene, t, choiceId);
          const delta = deltas[leak ? 'leak' : 'meteors'][choiceId];
          const expected = {
            life: Math.min(100, game.meters.life + delta.life),
            power: game.meters.power + delta.power,
            shield: Math.min(100, game.meters.shield + delta.shield),
          };
          expect(result.playback.game.meters).toEqual(expected);
          expect(result.playback.game.science).toBe(
            game.science + delta.science,
          );
          expect(result.playback.game.flags.includes('usedBackupO2')).toBe(
            leak && choiceId === 'B',
          );
          expect(result.playback.game.history).toHaveLength(8);
          expect(result.playback.game.solarPenalty).toBe(game.solarPenalty);
          expect(sceneView(scene, result.playback)?.textKey).toBe(
            `${scene.eventId}.${choiceId}.after`,
          );
          const card = advance(scene, result);
          expect(card.playback.game.albumIds).toContain(
            leak ? 'rm_leak' : 'rm_craters',
          );
          const night = advance(scene, card);
          expect(night.playback.status).toBe('complete');
          expect(night.playback.game.meters.life).toBe(
            expected.life - game.modifiers.lifeUpkeep,
          );
          expect(night.playback.game.meters.power).toBe(
            expected.power - game.modifiers.baseLoad,
          );
          expect(beginNextSol(night.playback.game).sol).toBe(9);
          expect(advance(scene, night).checkpoints).toEqual([]);
          expect(result.playback.game.sky).toEqual(game.sky);
          expect(game).toEqual(original);
        });
      }
  it.each(['done', 'skipped', 'disabled'] as const)(
    'patch task %s awards only the approved optional bonus',
    (mode) => {
      const game = sol8('B'),
        scene = createSol08Scene(game.flags);
      let result = choose(scene, ready(scene, game), 'A', mode !== 'disabled');
      if (mode !== 'disabled') {
        expect(result.playback.game.history).toHaveLength(7);
        expect(result.playback.game.meters).toEqual(game.meters);
        result = sendSceneInput(
          scene,
          result.playback,
          {
            type: 'mini_game_result',
            stepId: result.playback.cursor.stepId,
            result: mode,
          },
          { miniGames: true },
        );
      }
      expect(result.playback.game.meters.power).toBe(
        game.meters.power - 10 + (mode === 'done' ? 2 : 0),
      );
      expect(result.playback.game.history).toHaveLength(8);
      expect(
        sendSceneInput(scene, result.playback, {
          type: 'mini_game_result',
          stepId: 'leak.patch_leak',
          result: 'done',
        }).checkpoints,
      ).toEqual([]);
    },
  );
  it.each([false, true])(
    'Continue restores the committed branch quickPatch=%s without replaying costs',
    (leak) => {
      const game = sol8(leak ? 'B' : 'A'),
        scene = createSol08Scene(game.flags);
      const result = choose(scene, ready(scene, game), 'B');
      const restored = resumeScene(
        scene,
        createSaveEnvelope({
          runId: 'sol8-test',
          state: result.playback.game,
          cursor: result.playback.cursor,
          checkpoint: 'choice_result',
          savedAt: '2026-11-14T01:00:00Z',
        }),
      );
      expect(restored.playback.game).toEqual(result.playback.game);
      expect(restored.cues).toEqual([]);
      const card = advance(scene, restored);
      const pause = advance(scene, card, true);
      expect(sceneView(scene, pause.playback)?.step).toMatchObject({
        type: 'classroom_pause',
        questionKey: `${scene.eventId}.classroom`,
      });
      expect(advance(scene, pause, true).playback.status).toBe('complete');
    },
  );
  it('reopens an unfinished patch without a bonus and permits Skip', () => {
    const game = sol8('B'),
      scene = createSol08Scene(game.flags),
      task = choose(scene, ready(scene, game), 'A', true);
    const restored = resumeScene(
      scene,
      createSaveEnvelope({
        runId: 'sol8-test',
        state: task.playback.game,
        cursor: task.playback.cursor,
        checkpoint: 'sol_start',
        savedAt: '2026-11-14T01:00:00Z',
      }),
      { miniGames: true },
    );
    expect(restored.playback.game.meters).toEqual(game.meters);
    expect(restored.playback.cursor.miniGameResult).toBeUndefined();
    const result = sendSceneInput(
      scene,
      restored.playback,
      {
        type: 'mini_game_result',
        stepId: restored.playback.cursor.stepId,
        result: 'skipped',
      },
      { miniGames: true },
    );
    expect(result.playback.game.meters.power).toBe(game.meters.power - 10);
  });
  it.each([false, true])(
    'stops normal After/card flow on immediate failure, leak=%s',
    (leak) => {
      const game = sol8(leak ? 'B' : 'A');
      if (leak) game.meters.power = 1;
      else game.meters.life = 1;
      const scene = createSol08Scene(game.flags),
        choiceId = leak ? 'A' : 'C';
      const warning = choose(scene, ready(scene, game), choiceId);
      expect(warning.playback.caution).toBeDefined();
      const ended = sendSceneInput(scene, warning.playback, {
        type: 'confirm_choice',
        stepId: warning.playback.cursor.stepId,
        choiceId,
      });
      expect(ended.playback.status).toBe('ended');
      expect(ended.playback.game.ending).toBe('gentle');
      expect(ended.playback.game.albumIds).not.toContain(
        leak ? 'rm_leak' : 'rm_craters',
      );
    },
  );
  it.each([false, true])(
    'checks night failure after a safe choice, leak=%s',
    (leak) => {
      const game = sol8(leak ? 'B' : 'A');
      game.meters.power = 4;
      const scene = createSol08Scene(game.flags),
        result = choose(scene, ready(scene, game), leak ? 'B' : 'A');
      expect(result.playback.game.ending).toBeUndefined();
      const night = advance(scene, advance(scene, result));
      expect(night.playback.status).toBe('ended');
      expect(night.playback.game.failedMeter).toBe('power');
    },
  );
});
