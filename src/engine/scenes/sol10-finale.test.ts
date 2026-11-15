import { describe, expect, it } from 'vitest';
import copy from '../../content/sol10-finale.json';
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
import type { SceneCue, SceneTransition } from '../scene-player';
import { getEventRules } from '../rules';
import { createRetrySession } from '../retry';
import { createSaveEnvelope } from '../../services/storage';
import type { CargoId, ChoiceId, GameState, MeterId } from '../types';
import { createSol10Scene } from './sol10-finale';

const scene = createSol10Scene();
// Test-only input; do not ship synthetic NASA observations in runtime content.
function sol10(plants = false, cargo: CargoId[] = []): GameState {
  let game = launchMission(
    createMission({
      missionDate: '2026-11-14',
      contentVersion: 'sol10-test',
      sky: {
        level: 'calm',
        source: 'saved',
        fetchedAt: '2026-11-14T00:00:00Z',
      },
    }),
    cargo,
  );
  const choices: ChoiceId[] = [
    'A',
    'B',
    'A',
    'A',
    'B',
    'B',
    'A',
    'A',
    plants ? 'C' : 'B',
  ];
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
function advance(t: SceneTransition, classroomMode = false) {
  return sendSceneInput(
    scene,
    t.playback,
    { type: 'advance', stepId: t.playback.cursor.stepId },
    { classroomMode },
  );
}
function ready(game: GameState) {
  let t = startScene(scene, game);
  for (let n = 0; n < scene.steps.length; n++) {
    if (sceneView(scene, t.playback)?.step.type === 'choice') return t;
    t = advance(t);
  }
  throw new Error('Finale choice not reached');
}
function choose(t: SceneTransition, choiceId: ChoiceId) {
  return sendSceneInput(scene, t.playback, {
    type: 'choose',
    stepId: t.playback.cursor.stepId,
    choiceId,
  });
}
function successCue(cue: SceneCue) {
  return (
    (cue.type === 'mood' && cue.mood === 'finale_dawn') ||
    ('cueKey' in cue &&
      /sunrise|success_music|supply_ship|fireworks/.test(cue.cueKey))
  );
}
const deltas = {
  A: { life: -4, power: -8, shield: -4 },
  B: { life: 0, power: -10, shield: -8 },
  C: { life: -8, power: -10, shield: 0 },
} as const;

describe('Sol 10 finale', () => {
  it('validates all routes and resolves every authored line without draft markers', () => {
    expect(() => validateScene(scene)).not.toThrow();
    expect(
      scene.steps.some((s) => s.type === 'walk' || s.type === 'mini_game'),
    ).toBe(false);
    const keys = scene.steps.flatMap((s) =>
      'textKey' in s ? [s.textKey] : 'questionKey' in s ? [s.questionKey] : [],
    );
    keys.push(
      ...getEventRules('finale').choices.flatMap((c) => [
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
  });
  for (const cargo of [[], ['batteries', 'greenhouse_kit']] as CargoId[][])
    for (const choiceId of ['A', 'B', 'C'] as const) {
      it(`${choiceId}, cargo=${cargo.join(',')}: success waits for final upkeep and then presents the epilogue`, () => {
        const game = sol10(false, cargo),
          original = structuredClone(game),
          t = ready(game);
        expect(t.cues.some(successCue)).toBe(false);
        const result = choose(t, choiceId),
          delta = deltas[choiceId];
        const after = {
          life: game.meters.life + delta.life,
          power: game.meters.power + delta.power,
          shield: game.meters.shield + delta.shield,
        };
        expect(result.playback.game.meters).toEqual(after);
        expect(result.playback.game.history).toHaveLength(10);
        expect(result.playback.game.ending).toBeUndefined();
        expect(result.cues.some(successCue)).toBe(false);
        const card = advance(result);
        expect(card.playback.game.albumIds).toContain('rm_artemis');
        expect(card.playback.game.ending).toBeUndefined();
        const dawn = advance(card);
        expect(dawn.playback.game.meters).toEqual({
          life: after.life - game.modifiers.lifeUpkeep,
          power: after.power - game.modifiers.baseLoad,
          shield: after.shield,
        });
        expect(dawn.playback.game.ending).toBe('success');
        expect(dawn.playback.game.phase).toBe('ENDED');
        expect(dawn.playback.status).toBe('playing');
        expect(dawn.cues.some(successCue)).toBe(true);
        expect(dawn.cues.filter((c) => c.type === 'mission_end')).toHaveLength(
          1,
        );
        expect(sceneView(scene, dawn.playback)?.textKey).toBe(
          'finale.dialogue.thiri',
        );
        const robo = advance(dawn);
        expect(sceneView(scene, robo.playback)?.textKey).toBe(
          'finale.dialogue.complete',
        );
        expect(robo.playback.game.meters).toEqual(dawn.playback.game.meters);
        const complete = advance(robo);
        expect(complete.playback.status).toBe('ended');
        expect(advance(complete).cues).toEqual([]);
        expect(beginNextSol(complete.playback.game)).toBe(
          complete.playback.game,
        );
        expect(complete.playback.game.sky).toEqual(original.sky);
        expect(game).toEqual(original);
      });
    }
  const immediate: [ChoiceId, MeterId][] = [
    ['A', 'life'],
    ['A', 'power'],
    ['A', 'shield'],
    ['B', 'power'],
    ['B', 'shield'],
    ['C', 'life'],
    ['C', 'power'],
  ];
  it.each(immediate)(
    'choice %s emptying %s never reaches the card or celebration',
    (choiceId, meter) => {
      const game = sol10();
      game.meters[meter] = 1;
      const warning = choose(ready(game), choiceId);
      expect(warning.playback.caution).toBeDefined();
      const ended = sendSceneInput(scene, warning.playback, {
        type: 'confirm_choice',
        stepId: warning.playback.cursor.stepId,
        choiceId,
      });
      expect(ended.playback.status).toBe('ended');
      expect(ended.playback.game.ending).toBe('gentle');
      expect(ended.playback.game.failedMeter).toBe(meter);
      expect(ended.playback.game.albumIds).not.toContain('rm_artemis');
      expect(ended.cues.some(successCue)).toBe(false);
      expect(sceneView(scene, ended.playback)).toBeUndefined();
    },
  );
  it.each(['life', 'power'] as const)(
    'exactly empty %s after final night is failure, not success',
    (meter) => {
      const game = sol10();
      game.meters[meter] = meter === 'life' ? 5 : 18;
      const result = choose(ready(game), 'B');
      expect(result.playback.game.ending).toBeUndefined();
      const night = advance(advance(result));
      expect(night.playback.game.meters[meter]).toBe(0);
      expect(night.playback.status).toBe('ended');
      expect(night.playback.game.ending).toBe('gentle');
      expect(night.cues.some(successCue)).toBe(false);
    },
  );
  it('handles simultaneous result failures without playing the success epilogue', () => {
    const game = sol10();
    game.meters = { life: 4, power: 8, shield: 4 };
    const warning = choose(ready(game), 'A');
    const ended = sendSceneInput(scene, warning.playback, {
      type: 'confirm_choice',
      stepId: warning.playback.cursor.stepId,
      choiceId: 'A',
    });
    expect(ended.playback.game.failedMeter).toBe('power');
    expect(ended.cues.some(successCue)).toBe(false);
  });
  it('Continue after RESULT preserves costs and still performs the final night check', () => {
    const game = sol10(),
      result = choose(ready(game), 'C');
    const restored = resumeScene(
      scene,
      createSaveEnvelope({
        runId: 'finale-test',
        state: result.playback.game,
        cursor: result.playback.cursor,
        checkpoint: 'choice_result',
        savedAt: '2026-11-14T01:00:00Z',
      }),
    );
    expect(restored.playback.game).toEqual(result.playback.game);
    expect(restored.cues).toEqual([]);
    const dawn = advance(advance(restored));
    expect(dawn.playback.game.ending).toBe('success');
  });
  it('keeps classroom discussion before final night, with no premature success', () => {
    const result = choose(ready(sol10()), 'A'),
      card = advance(result),
      pause = advance(card, true);
    expect(sceneView(scene, pause.playback)?.step.type).toBe('classroom_pause');
    expect(pause.playback.game.ending).toBeUndefined();
    expect(advance(pause, true).playback.game.ending).toBe('success');
  });
  it('completed-save restoration never repeats upkeep or celebration', () => {
    const dawn = advance(advance(choose(ready(sol10()), 'A')));
    const restored = resumeScene(
      scene,
      createSaveEnvelope({
        runId: 'finale-test',
        state: dawn.playback.game,
        cursor: dawn.playback.cursor,
        checkpoint: 'ending',
        savedAt: '2026-11-14T01:00:00Z',
      }),
    );
    expect(restored.playback.status).toBe('ended');
    expect(restored.playback.game.meters).toEqual(dawn.playback.game.meters);
    expect(restored.cues).toEqual([]);
  });
  it('retry restores the same sol-start state without repeating the plants consequence', () => {
    const game = sol10(true),
      retry = createRetrySession(),
      start = startScene(scene, game);
    const checkpoint = start.checkpoints[0];
    expect(checkpoint.state.flags).toContain('plantsSuffered');
    retry.capture('finale-test', checkpoint.state, checkpoint.cursor);
    const failedInput = structuredClone(game);
    failedInput.meters.power = 1;
    const warning = choose(ready(failedInput), 'B');
    const ended = sendSceneInput(scene, warning.playback, {
      type: 'confirm_choice',
      stepId: warning.playback.cursor.stepId,
      choiceId: 'B',
    });
    const snapshot = retry.restore('finale-test', ended.playback.game)!;
    expect(snapshot.state).toEqual(game);
    expect(startScene(scene, snapshot.state).playback.game.meters).toEqual(
      game.meters,
    );
  });
});
