import { describe, expect, it } from 'vitest';
import { createSol02Scene } from './sol02-first-night';
import { createSol04Scene } from './sol04-ice-hunt';
import { createSol05Scene } from './sol05-calling-earth';
import { createSol09Scene } from './sol09-cold-night';
import { createMission } from '../state';
import {
  launchMission,
  resolveChoice,
  finishNight,
  encounterRealMoment,
} from '../resources';
import { startScene, sendSceneInput } from '../scene-player';
import { validateScene } from '../scene-registry';
import type { CargoId, ChoiceId } from '../types';

const cases = [
  {
    make: createSol02Scene,
    cargo: 'batteries',
    key: 'first_night.cargo.batteries',
    choice: undefined,
  },
  {
    make: createSol04Scene,
    cargo: 'rover_fuel',
    key: 'ice_hunt.cargo.rover_fuel',
    choice: 'B',
  },
  {
    make: createSol05Scene,
    cargo: 'radio_booster',
    key: 'calling_earth.cargo.radio_booster',
    choice: 'A',
  },
  {
    make: createSol09Scene,
    cargo: 'greenhouse_kit',
    key: 'cold_night.cargo.greenhouse_kit',
    choice: undefined,
  },
] as const;

describe('approved conditional cargo dialogue', () => {
  for (const item of cases)
    for (const packed of [false, true])
      for (const choiceId of ['A', 'B', 'C'] as const) {
        it(`${item.cargo}, packed=${packed}, choice=${choiceId}: speaks only when applicable and adds no effects`, () => {
          const cargo: CargoId[] = packed ? [item.cargo] : [];
          const scene = item.make(cargo);
          expect(() => validateScene(scene)).not.toThrow();
          const initial = launchMission(
            createMission({
              missionDate: '2026-11-14',
              contentVersion: 'callback-test',
              sky: {
                level: 'calm',
                source: 'saved',
                fetchedAt: '2026-11-14T00:00Z',
              },
            }),
            cargo,
          );
          // Isolated authored-sol fixture with room for changes; never shipped as NASA input.
          initial.sol = scene.sol;
          initial.meters = { life: 60, power: 60, shield: 60 };
          const options = { reduceMotion: true, miniGames: false };
          let t = startScene(scene, initial, options);
          const spoken: string[] = [];
          for (
            let n = 0;
            n < scene.steps.length + 5 && t.playback.status === 'playing';
            n++
          ) {
            const step = scene.steps.find(
              (s) => s.id === t.playback.cursor.stepId,
            )!;
            if ('textKey' in step) spoken.push(step.textKey);
            if ('textKey' in step && step.textKey === item.key && item.choice)
              expect(t.playback.game.history).toHaveLength(1);
            const input =
              step.type === 'walk'
                ? {
                    type: 'select_spot' as const,
                    stepId: step.id,
                    spotId: step.target,
                  }
                : step.type === 'choice'
                  ? {
                      type: 'choose' as const,
                      stepId: step.id,
                      choiceId: choiceId as ChoiceId,
                    }
                  : { type: 'advance' as const, stepId: step.id };
            t = sendSceneInput(scene, t.playback, input, options);
          }
          expect(t.playback.status).toBe('complete');
          const shouldSpeak =
            packed && (!item.choice || item.choice === choiceId);
          expect(spoken.filter((key) => key === item.key)).toHaveLength(
            shouldSpeak ? 1 : 0,
          );
          const card = scene.steps.find((s) => s.type === 'real_card')!;
          if (card.type !== 'real_card') throw new Error('Missing card');
          const expected = finishNight(
            encounterRealMoment(
              resolveChoice({ ...initial, phase: 'CHOICE' }, choiceId).state,
              card.realMomentId,
            ),
          );
          expect(t.playback.game).toEqual(expected);
        });
      }
});
