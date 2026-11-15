import { describe, expect, it } from 'vitest';
import copy from '../../content/sol07-equipment-failure.json';
import { createMission } from '../state';
import {
  beginNextSol,
  encounterRealMoment,
  finishNight,
  launchMission,
  resolveChoice,
} from '../resources';
import { validateScene } from '../scene-registry';
import {
  resumeScene,
  sceneView,
  sendSceneInput,
  startScene,
} from '../scene-player';
import type { SceneTransition } from '../scene-player';
import type { SceneDefinition } from '../scene-types';
import { getEventRules } from '../rules';
import { eventForSol } from '../schedule';
import { createSaveEnvelope } from '../../services/storage';
import type { ChoiceId, GameState } from '../types';
import { createSol07Scene } from './sol07-equipment-failure';

// Synthetic test input, not runtime NASA data. Advance through real engine transitions.
function sol7(ignored = false, spare = false): GameState {
  let game = launchMission(
    createMission({
      missionDate: '2026-11-14',
      contentVersion: 'sol7-test',
      sky: {
        level: 'calm',
        source: 'saved',
        fetchedAt: '2026-11-14T00:00:00Z',
      },
    }),
    spare ? ['spare_parts'] : [],
  );
  const choices: ChoiceId[] = ['A', 'B', 'A', 'A', ignored ? 'C' : 'B', 'B'];
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
        ? { type: 'select_spot', stepId: step.id, spotId: 'solar' }
        : { type: 'advance', stepId: step.id },
      { reduceMotion: true },
    );
  }
  throw new Error('Repair choice not reached');
}
function advance(scene: SceneDefinition, t: SceneTransition) {
  return sendSceneInput(scene, t.playback, {
    type: 'advance',
    stepId: t.playback.cursor.stepId,
  });
}
function toCard(scene: SceneDefinition, result: SceneTransition) {
  let t = result;
  for (let n = 0; n < scene.steps.length; n++) {
    if (sceneView(scene, t.playback)?.step.type === 'real_card') return t;
    t = advance(scene, t);
  }
  throw new Error('Repair card not reached');
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

describe('Sol 7 equipment failure', () => {
  it('validates routes and every text key without unresolved fact markers', () => {
    const scene = createSol07Scene(['spare_parts'], ['ignoredFlicker']);
    expect(() => validateScene(scene)).not.toThrow();
    const keys = scene.steps.flatMap((s) =>
      'textKey' in s ? [s.textKey] : 'questionKey' in s ? [s.questionKey] : [],
    );
    keys.push(
      ...getEventRules('equipment_failure').choices.flatMap((c) => [
        c.labelKey,
        c.afterKey,
      ]),
    );
    for (const key of keys) {
      expect(Object.hasOwn(copy, key), key).toBe(true);
      expect((copy as Record<string, string>)[key]).not.toMatch(
        /\[(?:CHECK|DATA)/,
      );
    }
    expect(scene.steps.filter((s) => s.type === 'mini_game')).toEqual([
      expect.objectContaining({ gameId: 'repair_wires' }),
    ]);
    expect(scene.steps.find((s) => s.type === 'walk')).toMatchObject({
      target: 'solar',
    });
  });
  it('selects the flicker and spare-parts lines only when applicable', () => {
    const ordinary = createSol07Scene();
    expect(
      ordinary.steps.find((s) => s.id.endsWith('.narration.2')),
    ).toMatchObject({ textKey: 'equipment_failure.narration.2' });
    expect(
      ordinary.steps.some((s) => s.id.endsWith('.cargo.spare_parts')),
    ).toBe(false);
    const callback = createSol07Scene(['spare_parts'], ['ignoredFlicker']);
    expect(
      callback.steps.find((s) => s.id.endsWith('.narration.2')),
    ).toMatchObject({ textKey: 'equipment_failure.narration.flicker' });
    expect(
      callback.steps.filter((s) => s.id.endsWith('.cargo.spare_parts')),
    ).toHaveLength(1);
  });
  for (const ignored of [false, true])
    for (const spare of [false, true])
      for (const choiceId of ['A', 'B', 'C'] as const) {
        it(`${choiceId}: earlier flicker=${ignored}, spare parts=${spare} applies each modifier once`, () => {
          const game = sol7(ignored, spare),
            original = structuredClone(game);
          const scene = createSol07Scene(game.cargo, game.flags),
            t = ready(scene, game);
          const result = choose(scene, t, choiceId);
          const baseCost = { A: 15, B: 6, C: 8 }[choiceId];
          expect(result.playback.game.meters.power).toBe(
            game.meters.power - baseCost - (ignored ? 5 : 0) + (spare ? 5 : 0),
          );
          expect(result.playback.game.history).toHaveLength(7);
          expect(result.playback.game.science).toBe(game.science);
          expect(result.playback.game.flags.includes('quickPatch')).toBe(
            choiceId === 'B',
          );
          expect(result.playback.game.solarPenalty).toBe(
            choiceId === 'C' ? 5 : 0,
          );
          const card = toCard(scene, result);
          expect(card.playback.game.albumIds).toContain('rm_wheels');
          const night = advance(scene, card);
          expect(night.playback.status).toBe('complete');
          const next = beginNextSol(night.playback.game);
          expect(next.sol).toBe(8);
          expect(eventForSol(next.sol, next.flags)).toBe(
            choiceId === 'B' ? 'leak' : 'meteors',
          );
          expect(next.meters.power).toBe(
            Math.min(
              100,
              night.playback.game.meters.power +
                game.modifiers.solarGain -
                (choiceId === 'C' ? 5 : 0),
            ),
          );
          expect(game).toEqual(original);
        });
      }
  it.each(['done', 'skipped', 'disabled'] as const)(
    'full repair with mini-game %s commits the correct bonus once',
    (mode) => {
      const game = sol7(),
        scene = createSol07Scene(),
        t = ready(scene, game);
      let result = choose(scene, t, 'A', mode !== 'disabled');
      if (mode !== 'disabled') {
        expect(result.playback.game.history).toHaveLength(6);
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
        game.meters.power - 15 + (mode === 'done' ? 2 : 0),
      );
      expect(result.playback.game.history).toHaveLength(7);
      expect(
        result.cues.some(
          (c) =>
            c.type === 'audio' &&
            c.cueKey === 'equipment_failure.repair_success',
        ),
      ).toBe(true);
      const duplicate = sendSceneInput(
        scene,
        result.playback,
        {
          type: 'mini_game_result',
          stepId: 'equipment_failure.repair_wires',
          result: 'done',
        },
        { miniGames: true },
      );
      expect(duplicate.checkpoints).toEqual([]);
      expect(duplicate.cues).toEqual([]);
    },
  );
  it('restores an unfinished repair task without applying costs or a completion bonus', () => {
    const game = sol7(true, true),
      scene = createSol07Scene(game.cargo, game.flags);
    const task = choose(scene, ready(scene, game), 'A', true);
    const save = createSaveEnvelope({
      runId: 'repair-test',
      state: task.playback.game,
      cursor: task.playback.cursor,
      checkpoint: 'sol_start',
      savedAt: '2026-11-14T01:00:00Z',
    });
    const reopened = resumeScene(scene, save, { miniGames: true });
    expect(reopened.playback.game.meters).toEqual(game.meters);
    expect(reopened.playback.game.history).toHaveLength(6);
    expect(sceneView(scene, reopened.playback)?.step.type).toBe('mini_game');
    const result = sendSceneInput(
      scene,
      reopened.playback,
      {
        type: 'mini_game_result',
        stepId: reopened.playback.cursor.stepId,
        result: 'skipped',
      },
      { miniGames: true },
    );
    expect(result.playback.game.meters.power).toBe(game.meters.power - 15);
  });
  it('restores the committed repair without repeating costs or the success jingle', () => {
    const game = sol7(),
      scene = createSol07Scene(),
      result = choose(scene, ready(scene, game), 'A');
    const restored = resumeScene(
      scene,
      createSaveEnvelope({
        runId: 'repair-test',
        state: result.playback.game,
        cursor: result.playback.cursor,
        checkpoint: 'choice_result',
        savedAt: '2026-11-14T01:00:00Z',
      }),
    );
    expect(restored.playback.game).toEqual(result.playback.game);
    expect(restored.cues).toEqual([]);
  });
  it('suppresses success cues and normal After/card flow when repair empties power', () => {
    const game = sol7();
    game.meters.power = 1;
    const scene = createSol07Scene(),
      warning = choose(scene, ready(scene, game), 'A');
    expect(warning.playback.caution).toBeDefined();
    const ended = sendSceneInput(scene, warning.playback, {
      type: 'confirm_choice',
      stepId: warning.playback.cursor.stepId,
      choiceId: 'A',
    });
    expect(ended.playback.status).toBe('ended');
    expect(ended.playback.game.failedMeter).toBe('power');
    expect(
      ended.cues.some(
        (c) =>
          c.type === 'audio' && c.cueKey === 'equipment_failure.repair_success',
      ),
    ).toBe(false);
    expect(ended.playback.game.albumIds).not.toContain('rm_wheels');
  });
  it('still checks night upkeep after an affordable quick patch', () => {
    const game = sol7();
    game.meters.power = 10;
    const scene = createSol07Scene(),
      result = choose(scene, ready(scene, game), 'B');
    expect(result.playback.game.ending).toBeUndefined();
    const night = advance(scene, toCard(scene, result));
    expect(night.playback.game.failedMeter).toBe('power');
    expect(night.playback.status).toBe('ended');
  });
});
