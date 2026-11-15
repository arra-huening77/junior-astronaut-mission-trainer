import type { SceneDefinition, SceneStep } from '../scene-types';
import type { CargoId } from '../types';

/** Approved script keys; costs, callbacks and bonuses resolve through events.json. */
export function createSol02Scene(
  cargo: readonly CargoId[] = [],
): SceneDefinition {
  const scene: SceneDefinition = {
    eventId: 'first_night',
    sol: 2,
    entryStepId: 'first_night.mood',
    steps: [
      {
        id: 'first_night.mood',
        type: 'scene',
        mood: 'dusk_night',
        next: 'first_night.music',
      },
      {
        id: 'first_night.music',
        type: 'audio',
        channel: 'music',
        action: 'play',
        cueKey: 'first_night.lullaby',
        next: 'first_night.ambient',
      },
      {
        id: 'first_night.ambient',
        type: 'audio',
        channel: 'ambient',
        action: 'play',
        cueKey: 'first_night.gentle_wind',
        next: 'first_night.camera',
      },
      {
        id: 'first_night.camera',
        type: 'camera',
        cueKey: 'first_night.night_sky',
        next: 'first_night.effects',
      },
      {
        id: 'first_night.effects',
        type: 'effect',
        cueKey: 'first_night.panels_dim_windows_glow_stars_battery_breath',
        next: 'first_night.narration.1',
      },
      {
        id: 'first_night.narration.1',
        type: 'narration',
        speaker: 'robo',
        expression: 'explaining',
        textKey: 'first_night.narration.1',
        next: 'first_night.narration.2',
      },
      {
        id: 'first_night.narration.2',
        type: 'narration',
        speaker: 'robo',
        expression: 'explaining',
        textKey: 'first_night.narration.2',
        next: 'first_night.dialogue.1',
      },
      {
        id: 'first_night.dialogue.1',
        type: 'dialogue',
        speaker: 'mei',
        expression: 'neutral',
        textKey: 'first_night.dialogue.1',
        next: 'first_night.dialogue.2',
      },
      {
        id: 'first_night.dialogue.2',
        type: 'dialogue',
        speaker: 'kai',
        expression: 'neutral',
        textKey: 'first_night.dialogue.2',
        next: 'first_night.question',
      },
      {
        id: 'first_night.question',
        type: 'narration',
        speaker: 'robo',
        expression: 'thinking',
        textKey: 'first_night.question',
        next: 'first_night.choice',
      },
      {
        id: 'first_night.choice',
        type: 'choice',
        eventId: 'first_night',
        nextByChoice: {
          A: 'first_night.result.A',
          B: 'first_night.result.B',
          C: 'first_night.result.C',
        },
      },
      {
        id: 'first_night.result.A',
        type: 'result',
        eventId: 'first_night',
        next: 'first_night.after.A',
      },
      {
        id: 'first_night.after.A',
        type: 'after',
        eventId: 'first_night',
        choiceId: 'A',
        speaker: 'robo',
        expression: 'explaining',
        next: 'first_night.real_card',
      },
      {
        id: 'first_night.result.B',
        type: 'result',
        eventId: 'first_night',
        next: 'first_night.after.B',
      },
      {
        id: 'first_night.after.B',
        type: 'after',
        eventId: 'first_night',
        choiceId: 'B',
        speaker: 'robo',
        expression: 'explaining',
        next: 'first_night.real_card',
      },
      {
        id: 'first_night.result.C',
        type: 'result',
        eventId: 'first_night',
        next: 'first_night.after.C',
      },
      {
        id: 'first_night.after.C',
        type: 'after',
        eventId: 'first_night',
        choiceId: 'C',
        speaker: 'robo',
        expression: 'explaining',
        next: 'first_night.real_card',
      },
      {
        id: 'first_night.real_card',
        type: 'real_card',
        realMomentId: 'rm_moons_night',
        next: 'first_night.classroom',
      },
      {
        id: 'first_night.classroom',
        type: 'classroom_pause',
        questionKey: 'first_night.classroom',
        next: 'first_night.night',
      },
      {
        id: 'first_night.night',
        type: 'night',
      },
    ],
  };

  if (!cargo.includes('batteries')) return scene;
  const anchor = scene.steps.find(
    (step) => step.id === 'first_night.dialogue.2',
  );
  if (!anchor || (anchor.type !== 'dialogue' && anchor.type !== 'after'))
    throw new TypeError('Missing cargo callback anchor.');
  const callback: SceneStep = {
    id: 'first_night.cargo.batteries',
    type: 'dialogue',
    speaker: 'robo',
    expression: 'explaining',
    textKey: 'first_night.cargo.batteries',
    next: anchor.next,
  };
  return {
    ...scene,
    steps: scene.steps.flatMap((step) =>
      step.id === anchor.id
        ? [{ ...anchor, next: callback.id }, callback]
        : [step],
    ),
  };
}
