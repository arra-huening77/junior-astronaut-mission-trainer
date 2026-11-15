import { describe, expect, it } from 'vitest';
import { createMission } from './state';
import { launchMission } from './resources';
import { getEventRules } from './rules';
import { createSceneRegistry, validateScene } from './scene-registry';
import { sendSceneInput, startScene, stampSceneInput } from './scene-player';
import type { SceneTransition } from './scene-player';
import type { SceneDefinition, SceneStep } from './scene-types';

// Test routing only: these keys are not approved runtime dialogue or NASA observations.
function fixture(): SceneDefinition {
  const steps: SceneStep[] = [
    { id: 'mood', type: 'scene', mood: 'calm_day', next: 'intro' },
    {
      id: 'intro',
      type: 'narration',
      speaker: 'robo',
      expression: 'neutral',
      textKey: 'test.intro',
      next: 'walk',
    },
    { id: 'walk', type: 'walk', target: 'habitat', next: 'choice' },
    {
      id: 'choice',
      type: 'choice',
      eventId: 'touchdown',
      nextByChoice: { A: 'result-A', B: 'result-B', C: 'result-C' },
    },
  ];
  for (const choice of getEventRules('touchdown').choices) {
    steps.push(
      {
        id: `result-${choice.id}`,
        type: 'result',
        eventId: 'touchdown',
        next: `after-${choice.id}`,
      },
      {
        id: `after-${choice.id}`,
        type: 'after',
        eventId: 'touchdown',
        choiceId: choice.id,
        speaker: 'robo',
        expression: 'explaining',
        next: 'card',
      },
    );
  }
  steps.push(
    { id: 'card', type: 'real_card', realMomentId: 'test-card', next: 'pause' },
    {
      id: 'pause',
      type: 'classroom_pause',
      questionKey: 'test.question',
      next: 'night',
    },
    { id: 'night', type: 'night' },
  );
  return { eventId: 'touchdown', sol: 1, entryStepId: 'mood', steps };
}
function game() {
  return launchMission(
    createMission({
      missionDate: '2026-11-14',
      contentVersion: 'test',
      sky: {
        level: 'calm',
        source: 'saved',
        fetchedAt: '2026-11-14T00:00:00Z',
      },
    }),
    [],
  );
}
function advance(scene: SceneDefinition, t: SceneTransition) {
  return sendSceneInput(
    scene,
    t.playback,
    stampSceneInput(t.playback, {
      type: 'advance',
      stepId: t.playback.cursor.stepId,
    }),
  );
}
function atChoice(scene: SceneDefinition) {
  let t = advance(scene, startScene(scene, game()));
  t = sendSceneInput(
    scene,
    t.playback,
    { type: 'select_spot', stepId: 'walk', spotId: 'habitat' },
    { reduceMotion: true },
  );
  return t;
}
describe('scene player', () => {
  it('waits for child input, provides one-shot cues, and preserves the caller state', () => {
    const scene = fixture(),
      initial = game(),
      before = structuredClone(initial);
    const t = startScene(scene, initial);
    expect(t.playback.cursor.stepId).toBe('intro');
    expect(t.cues.map((c) => c.type)).toEqual(['mood']);
    expect(t.checkpoints[0].state.phase).toBe('BRIEFING');
    expect(initial).toEqual(before);
    const duplicate = sendSceneInput(scene, t.playback, {
      type: 'advance',
      stepId: 'mood',
    });
    expect(duplicate.playback).toBe(t.playback);
    expect(duplicate.cues).toEqual([]);
  });
  it('gives friendly wrong-spot feedback and waits for movement completion', () => {
    const scene = fixture();
    const t = advance(scene, startScene(scene, game()));
    const wrong = sendSceneInput(scene, t.playback, {
      type: 'select_spot',
      stepId: 'walk',
      spotId: 'solar',
    });
    expect(wrong.feedback).toBe('wrong_spot');
    expect(wrong.playback).toBe(t.playback);
    const walking = sendSceneInput(scene, t.playback, {
      type: 'select_spot',
      stepId: 'walk',
      spotId: 'habitat',
    });
    expect(walking.playback.game.phase).toBe('WALKING');
    expect(walking.cues[0].type).toBe('walk');
    expect(advance(scene, walking).playback.game.phase).toBe('CHOICE');
  });
  it.each(['A', 'B', 'C'] as const)(
    'commits %s once, then card and night in order',
    (choiceId) => {
      const scene = fixture(),
        t = atChoice(scene);
      const result = sendSceneInput(scene, t.playback, {
        type: 'choose',
        stepId: 'choice',
        choiceId,
      });
      expect(result.playback.game.history).toHaveLength(1);
      expect(result.playback.cursor.stepId).toBe(`after-${choiceId}`);
      expect(
        result.cues.filter((c) => c.type === 'choice_result'),
      ).toHaveLength(1);
      expect(
        sendSceneInput(scene, result.playback, {
          type: 'choose',
          stepId: 'choice',
          choiceId,
        }).checkpoints,
      ).toEqual([]);
      const card = advance(scene, result);
      expect(card.playback.game.albumIds).toContain('test-card');
      const night = advance(scene, card);
      expect(night.playback.status).toBe('complete');
      expect(night.playback.game.phase).toBe('NIGHT');
      expect(advance(scene, night).playback).toBe(night.playback);
    },
  );
  it('rejects stale view tokens even when the step ID matches', () => {
    const scene = fixture(),
      t = atChoice(scene);
    const ignored = sendSceneInput(scene, t.playback, {
      type: 'choose',
      stepId: 'choice',
      choiceId: 'A',
      visit: -1,
    });
    expect(ignored.playback).toBe(t.playback);
  });
  it('pauses for classroom discussion only when enabled', () => {
    const scene = fixture(),
      t = atChoice(scene);
    const result = sendSceneInput(scene, t.playback, {
      type: 'choose',
      stepId: 'choice',
      choiceId: 'A',
    });
    const card = advance(scene, result);
    const pause = sendSceneInput(
      scene,
      card.playback,
      { type: 'advance', stepId: 'card' },
      { classroomMode: true },
    );
    expect(pause.playback.cursor.stepId).toBe('pause');
    expect(advance(scene, pause).playback.status).toBe('complete');
  });
});
describe('authored routing validation', () => {
  it('rejects loops, missing destinations, wrong After branches and unreachable steps', () => {
    for (const defect of ['loop', 'missing', 'after', 'orphan']) {
      const scene = fixture();
      if (defect === 'loop')
        (scene.steps[0] as Extract<SceneStep, { type: 'scene' }>).next = 'mood';
      if (defect === 'missing')
        (scene.steps[0] as Extract<SceneStep, { type: 'scene' }>).next =
          'missing';
      if (defect === 'after')
        (
          scene.steps.find((s) => s.id === 'after-A') as Extract<
            SceneStep,
            { type: 'after' }
          >
        ).choiceId = 'B';
      if (defect === 'orphan')
        scene.steps = [...scene.steps, { id: 'orphan', type: 'night' }];
      expect(() => validateScene(scene)).toThrow();
    }
  });
  it('returns isolated scene copies and fails explicitly for unwritten content', () => {
    const registry = createSceneRegistry([fixture()]);
    const copy = registry.resolve(game());
    (copy.steps[0] as Extract<SceneStep, { type: 'scene' }>).next = 'bad';
    expect(
      (
        registry.resolve(game()).steps[0] as Extract<
          SceneStep,
          { type: 'scene' }
        >
      ).next,
    ).toBe('intro');
    expect(() => registry.resolve({ ...game(), sol: 2 })).toThrow(
      'not implemented',
    );
  });
});

import { resumeScene } from './scene-player';
import { createSaveEnvelope } from '../services/storage';

describe('scene edge paths', () => {
  it('resumes committed results without charging the choice or night twice', () => {
    const scene = fixture();
    const t = atChoice(scene);
    const result = sendSceneInput(scene, t.playback, {
      type: 'choose',
      stepId: 'choice',
      choiceId: 'A',
    });
    const saved = createSaveEnvelope({
      runId: 'test-run',
      state: result.playback.game,
      checkpoint: 'choice_result',
      cursor: result.playback.cursor,
      savedAt: '2026-11-14T00:00:00Z',
    });
    const restored = resumeScene(scene, saved);
    expect(restored.playback.game).toEqual(result.playback.game);
    expect(restored.cues).toEqual([]);
    const night = advance(scene, advance(scene, restored));
    const reopened = resumeScene(
      scene,
      createSaveEnvelope({
        ...saved,
        state: night.playback.game,
        cursor: night.playback.cursor,
        checkpoint: 'night',
      }),
    );
    expect(reopened.playback.game.meters).toEqual(night.playback.game.meters);
    expect(reopened.checkpoints).toEqual([]);
  });
  it('requires confirmation before an immediately failing choice and stops the After flow', () => {
    const scene = fixture(),
      t = atChoice(scene);
    t.playback.game.meters.power = 1;
    const risky = getEventRules('touchdown').choices.find(
      (c) => (c.effects.power ?? 0) < 0,
    )!;
    expect(risky).toBeDefined();
    const caution = sendSceneInput(scene, t.playback, {
      type: 'choose',
      stepId: 'choice',
      choiceId: risky.id,
    });
    expect(caution.playback.game.history).toHaveLength(0);
    expect(caution.playback.caution).toBeDefined();
    const cancel = sendSceneInput(scene, caution.playback, {
      type: 'cancel_choice',
      stepId: 'choice',
    });
    expect(cancel.playback.caution).toBeUndefined();
    const ended = sendSceneInput(scene, caution.playback, {
      type: 'confirm_choice',
      stepId: 'choice',
      choiceId: risky.id,
    });
    expect(ended.playback.status).toBe('ended');
    expect(ended.playback.game.ending).toBe('gentle');
    expect(ended.playback.game.albumIds).toEqual([]);
  });
  it.each(['done', 'skipped', 'disabled'] as const)(
    'handles a mini-game %s without duplicate bonuses',
    (mode) => {
      const source = fixture();
      const steps = source.steps.map((step) => {
        if (step.type === 'choice')
          return {
            ...step,
            eventId: 'dust_storm' as const,
            nextByChoice: { ...step.nextByChoice, A: 'task' },
          };
        if (step.type === 'result' || step.type === 'after')
          return { ...step, eventId: 'dust_storm' as const };
        return step;
      });
      steps.push({
        id: 'task',
        type: 'mini_game',
        gameId: 'cover_panels',
        next: 'result-A',
      });
      const scene: SceneDefinition = {
        ...source,
        sol: 3,
        eventId: 'dust_storm',
        steps,
      };
      let t = startScene(scene, { ...game(), sol: 3 });
      t = advance(scene, t);
      t = sendSceneInput(
        scene,
        t.playback,
        { type: 'select_spot', stepId: 'walk', spotId: 'habitat' },
        { reduceMotion: true },
      );
      const before = t.playback.game.meters.power;
      t = sendSceneInput(
        scene,
        t.playback,
        { type: 'choose', stepId: 'choice', choiceId: 'A' },
        { miniGames: mode !== 'disabled' },
      );
      if (mode !== 'disabled') {
        expect(t.playback.game.history).toHaveLength(0);
        t = sendSceneInput(
          scene,
          t.playback,
          { type: 'mini_game_result', stepId: 'task', result: mode },
          { miniGames: true },
        );
      }
      expect(t.playback.game.meters.power).toBe(
        before - 10 + (mode === 'done' ? 2 : 0),
      );
      expect(t.playback.game.history).toHaveLength(1);
      expect(
        sendSceneInput(scene, t.playback, {
          type: 'mini_game_result',
          stepId: 'task',
          result: 'done',
        }).checkpoints,
      ).toEqual([]);
    },
  );
});
