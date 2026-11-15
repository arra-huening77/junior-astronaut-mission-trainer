import { describe, expect, it } from 'vitest';
import copy from '../../content/sol06-solar-encounter.json';
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
import type { ScenePlayback, SceneTransition } from '../scene-player';
import { getEventRules, rulesForSky } from '../rules';
import { createSaveEnvelope } from '../../services/storage';
import type { ChoiceId, GameState, SkyLevel } from '../types';
import type { SceneDefinition } from '../scene-types';
import { createSol06Scene } from './sol06-solar-encounter';

const levels = ['calm', 'active', 'stormy'] as const;
// Test-only input. No synthetic NASA observations are included in runtime content.
function sol6(level: SkyLevel): GameState {
  let game = launchMission(
    createMission({
      missionDate: '2026-11-14',
      contentVersion: 'sol6-test',
      sky: { level, source: 'saved', fetchedAt: '2026-11-14T00:00:00Z' },
    }),
    [],
  );
  for (const choice of ['A', 'B', 'A', 'A', 'B'] as const) {
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
  game.science = 6;
  return game;
}
function choiceReady(scene: SceneDefinition, game: GameState): SceneTransition {
  let t = startScene(scene, game);
  for (let count = 0; count < scene.steps.length; count++) {
    if (sceneView(scene, t.playback)?.step.type === 'choice') return t;
    t = sendSceneInput(scene, t.playback, {
      type: 'advance',
      stepId: t.playback.cursor.stepId,
    });
  }
  throw new Error('Solar choice was not reached');
}
function advance(
  scene: SceneDefinition,
  playback: ScenePlayback,
  classroomMode = false,
) {
  return sendSceneInput(
    scene,
    playback,
    { type: 'advance', stepId: playback.cursor.stepId },
    { classroomMode },
  );
}
const approved = {
  calm: { A: [-4, 6], B: [-2, 3], C: [0, -4] },
  active: { A: [-10, 14], B: [-4, 7], C: [0, -10] },
  stormy: { A: [-15, 20], B: [-5, 10], C: [0, -20] },
} as const;

describe('Sol 6 authored versions', () => {
  it.each(levels)(
    'validates %s routes, text keys and no-walk solar pacing',
    (level) => {
      const scene = createSol06Scene(level, ['shield_plating']);
      expect(() => validateScene(scene)).not.toThrow();
      expect(
        scene.steps.some((s) => s.type === 'walk' || s.type === 'mini_game'),
      ).toBe(false);
      const keys = scene.steps.flatMap((s) =>
        'textKey' in s
          ? [s.textKey]
          : 'questionKey' in s
            ? [s.questionKey]
            : [],
      );
      keys.push(
        ...rulesForSky(getEventRules('solar_storm'), level).choices.flatMap(
          (c) => [c.labelKey, c.afterKey],
        ),
      );
      for (const key of keys) {
        expect(Object.hasOwn(copy, key), key).toBe(true);
        expect((copy as Record<string, string>)[key]).not.toMatch(
          /\[(?:DATA|CHECK)/,
        );
      }
      expect(
        scene.steps.filter((s) => s.id.endsWith('.cargo.shield_plating')),
      ).toHaveLength(1);
      expect(
        createSol06Scene(level).steps.some((s) =>
          s.id.endsWith('.cargo.shield_plating'),
        ),
      ).toBe(false);
    },
  );

  for (const level of levels)
    for (const choiceId of ['A', 'B', 'C'] as const) {
      it(`${level} / ${choiceId}: commits the approved effects, card and night once`, () => {
        const scene = createSol06Scene(level),
          input = sol6(level),
          original = structuredClone(input);
        const ready = choiceReady(scene, input);
        const chosen = sendSceneInput(scene, ready.playback, {
          type: 'choose',
          stepId: ready.playback.cursor.stepId,
          choiceId,
        });
        const [power, shield] = approved[level][choiceId];
        expect(chosen.playback.game.meters).toEqual({
          life: input.meters.life,
          power: input.meters.power + power,
          shield: Math.min(100, input.meters.shield + shield),
        });
        expect(chosen.playback.game.science).toBe(
          6 + (choiceId === 'C' ? 2 : 0),
        );
        expect(chosen.playback.game.history).toHaveLength(6);
        expect(sceneView(scene, chosen.playback)?.textKey).toBe(
          `solar_storm.${level}.${choiceId}.after`,
        );
        const duplicate = sendSceneInput(scene, chosen.playback, {
          type: 'choose',
          stepId: ready.playback.cursor.stepId,
          choiceId,
        });
        expect(duplicate.checkpoints).toEqual([]);
        const card = advance(scene, chosen.playback);
        expect(card.playback.game.albumIds).toContain('rm_solar_event');
        const night = advance(scene, card.playback);
        expect(night.playback.status).toBe('complete');
        expect(night.playback.game.phase).toBe('NIGHT');
        expect(night.playback.game.meters.power).toBe(
          input.meters.power + power - input.modifiers.baseLoad,
        );
        expect(night.playback.game.meters.life).toBe(
          input.meters.life - input.modifiers.lifeUpkeep,
        );
        expect(night.playback.game.sky).toEqual(original.sky);
        expect(input).toEqual(original);
      });
    }

  it('registry resolution follows frozen input and rejects a mismatched timeline', () => {
    const registry = createSceneRegistry(
      levels.map((level) => createSol06Scene(level)),
    );
    for (const level of levels)
      expect(registry.resolve(sol6(level)).variant).toBe(level);
    expect(() => startScene(createSol06Scene('stormy'), sol6('calm'))).toThrow(
      'frozen mission context',
    );
  });

  it.each(levels)(
    'restores %s After progress without repeating choice effects or cues',
    (level) => {
      const scene = createSol06Scene(level),
        ready = choiceReady(scene, sol6(level));
      const chosen = sendSceneInput(scene, ready.playback, {
        type: 'choose',
        stepId: ready.playback.cursor.stepId,
        choiceId: 'B',
      });
      const saved = createSaveEnvelope({
        runId: 'solar-test',
        state: chosen.playback.game,
        cursor: chosen.playback.cursor,
        checkpoint: 'choice_result',
        savedAt: '2026-11-14T01:00:00Z',
      });
      const restored = resumeScene(scene, saved);
      expect(restored.playback.game).toEqual(chosen.playback.game);
      expect(restored.cues).toEqual([]);
      expect(restored.checkpoints).toEqual([]);
      const card = advance(scene, restored.playback);
      const pause = advance(scene, card.playback, true);
      expect(sceneView(scene, pause.playback)?.step.type).toBe(
        'classroom_pause',
      );
      expect(advance(scene, pause.playback, true).playback.status).toBe(
        'complete',
      );
    },
  );

  it('keeps calm cues free of the active/stormy warnings', () => {
    const scene = createSol06Scene('calm');
    const cues = startScene(scene, sol6('calm')).cues;
    expect(
      cues.every((c) => c.eventId === 'solar_storm' && c.variant === 'calm'),
    ).toBe(true);
    expect(JSON.stringify(cues)).not.toMatch(
      /sun_watch|edge_pulse|shelter|amber/,
    );
  });

  it.each(['A', 'C'] as const)(
    'stops an immediately failing %s before normal After/card flow',
    (choiceId) => {
      const scene = createSol06Scene('stormy'),
        game = sol6('stormy');
      if (choiceId === 'A') game.meters.power = 1;
      else game.meters.shield = 1;
      const ready = choiceReady(scene, game);
      const warning = sendSceneInput(scene, ready.playback, {
        type: 'choose',
        stepId: ready.playback.cursor.stepId,
        choiceId,
      });
      expect(warning.playback.caution?.choiceId).toBe(choiceId);
      const ended = sendSceneInput(scene, warning.playback, {
        type: 'confirm_choice',
        stepId: warning.playback.cursor.stepId,
        choiceId,
      });
      expect(ended.playback.status).toBe('ended');
      expect(ended.playback.game.ending).toBe('gentle');
      expect(ended.playback.game.albumIds).not.toContain('rm_solar_event');
      expect(sceneView(scene, ended.playback)).toBeUndefined();
    },
  );

  it('checks night failure after a safe solar choice', () => {
    const scene = createSol06Scene('calm'),
      game = sol6('calm');
    game.meters.power = 10;
    const ready = choiceReady(scene, game);
    const chosen = sendSceneInput(scene, ready.playback, {
      type: 'choose',
      stepId: ready.playback.cursor.stepId,
      choiceId: 'A' as ChoiceId,
    });
    expect(chosen.playback.game.ending).toBeUndefined();
    const card = advance(scene, chosen.playback);
    const night = advance(scene, card.playback);
    expect(night.playback.game.failedMeter).toBe('power');
    expect(night.playback.status).toBe('ended');
  });
});
