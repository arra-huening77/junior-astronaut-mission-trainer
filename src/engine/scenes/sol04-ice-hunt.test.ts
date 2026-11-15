import script from '../../../docs/story-script.md?raw';
import { describe, expect, it } from 'vitest';
import text from '../../content/sol04-ice-hunt.json';
import { createSol04Scene } from './sol04-ice-hunt';
import { validateScene } from '../scene-registry';
import { getEventRules } from '../rules';
import { createMission } from '../state';
import {
  launchMission,
  resolveChoice,
  finishNight,
  encounterRealMoment,
} from '../resources';
import { sendSceneInput, startScene, stampSceneInput } from '../scene-player';
import type { SceneInput } from '../scene-types';

const scene = createSol04Scene();
const rules = getEventRules('ice_hunt');

describe('approved Sol 04 timeline', () => {
  it('validates every branch, text key, approved line and event-keyed cue', () => {
    expect(() => validateScene(scene)).not.toThrow();
    const keys = [
      ...scene.steps,
      ...createSol04Scene(['rover_fuel']).steps,
    ].flatMap((s) =>
      'textKey' in s ? [s.textKey] : 'questionKey' in s ? [s.questionKey] : [],
    );
    keys.push(...rules.choices.flatMap((c) => [c.labelKey, c.afterKey]));
    expect(new Set(keys)).toEqual(new Set(Object.keys(text)));
    for (const key of keys) {
      const line = (text as Record<string, string>)[key];
      expect(line).toBeTruthy();
      expect(line).not.toMatch(/\[(DATA|CHECK)/);
      // Prompt capitalization and the attributed Curiosity quotation are presentation only.
      expect(script.toLowerCase()).toContain(line.toLowerCase());
    }
    for (const step of scene.steps) {
      if ('cueKey' in step)
        expect(step.cueKey.startsWith('ice_hunt.')).toBe(true);
    }
    expect(scene.steps.find((s) => s.type === 'real_card')).toMatchObject({
      realMomentId: 'rm_soil_water',
    });
  });

  for (const choiceId of ['A', 'B', 'C'] as const) {
    for (const mode of ['done', 'skipped', 'disabled'] as const) {
      for (const classroomMode of [false, true]) {
        it(`${choiceId}, task ${mode}, classroom ${classroomMode}: commits once and reaches night`, () => {
          const initial = launchMission(
            createMission({
              missionDate: '2026-11-14',
              contentVersion: 'timeline-test',
              sky: {
                level: 'calm',
                source: 'saved',
                fetchedAt: '2026-11-14T00:00:00Z',
              },
            }),
            [],
          );
          // Isolated sol-start fixture, with room for gains and enough resources for every route.
          initial.sol = 4;
          initial.meters = { life: 60, power: 60, shield: 60 };
          const options = {
            miniGames: mode !== 'disabled',
            classroomMode,
            reduceMotion: true,
          };
          let t = startScene(scene, initial, options);
          const seen: string[] = [];
          for (let n = 0; n < 60 && t.playback.status === 'playing'; n++) {
            const step = scene.steps.find(
              (s) => s.id === t.playback.cursor.stepId,
            )!;
            seen.push(step.id);
            let input: SceneInput = { type: 'advance', stepId: step.id };
            if (step.type === 'walk')
              input = {
                type: 'select_spot',
                stepId: step.id,
                spotId: step.target,
              };
            if (step.type === 'choice')
              input = { type: 'choose', stepId: step.id, choiceId };
            if (step.type === 'mini_game') {
              expect(t.playback.game.history).toHaveLength(0);
              input = {
                type: 'mini_game_result',
                stepId: step.id,
                result: mode === 'done' ? 'done' : 'skipped',
              };
            }
            const before = t.playback;
            t = sendSceneInput(
              scene,
              before,
              stampSceneInput(before, input),
              options,
            );
            // Delayed/double callbacks may not replay costs or task rewards.
            expect(
              sendSceneInput(
                scene,
                t.playback,
                stampSceneInput(before, input),
                options,
              ).playback,
            ).toEqual(t.playback);
          }
          expect(t.playback.status).toBe('complete');
          const attached = rules.choices.find(
            (c) => c.id === choiceId,
          )!.miniGame;
          const committed = resolveChoice(
            { ...initial, phase: 'CHOICE' },
            choiceId,
            attached && mode !== 'disabled' ? mode : undefined,
          ).state;
          const cardId = scene.steps.find((s) => s.type === 'real_card')!;
          if (cardId.type !== 'real_card') throw new Error('Missing card');
          const expected = finishNight(
            encounterRealMoment(committed, cardId.realMomentId),
          );
          expect(t.playback.game.meters).toEqual(expected.meters);
          expect(t.playback.game.flags).toEqual(expected.flags);
          expect(t.playback.game.pending).toEqual(expected.pending);
          expect(t.playback.game.science).toBe(expected.science);
          expect(t.playback.game.history).toEqual(expected.history);
          expect(t.playback.game.albumIds).toContain('rm_soil_water');
          expect(seen).toContain(`ice_hunt.after.${choiceId}`);
          expect(seen.includes('ice_hunt.classroom')).toBe(classroomMode);
          expect(
            seen.filter((id) => id.startsWith('ice_hunt.task.')),
          ).toHaveLength(attached && mode !== 'disabled' ? 1 : 0);
          if (scene.sol === 5) {
            expect(seen.includes('calling_earth.reply.A')).toBe(
              choiceId === 'A',
            );
            if (choiceId === 'A')
              expect(seen.indexOf('calling_earth.reply.A')).toBeGreaterThan(
                seen.indexOf('calling_earth.choice'),
              );
          }
        });
      }
    }
  }
});
