import type { SceneDefinition, SceneStep } from '../scene-types';
import type { CargoId } from '../types';

/** Approved script keys; costs, callbacks and bonuses resolve through events.json. */
export function createSol09Scene(
  cargo: readonly CargoId[] = [],
): SceneDefinition {
  const scene: SceneDefinition = {
    eventId: 'cold_night',
    sol: 9,
    entryStepId: 'cold_night.mood',
    steps: [
      {
        id: 'cold_night.mood',
        type: 'scene',
        mood: 'cold_night',
        next: 'cold_night.music',
      },
      {
        id: 'cold_night.music',
        type: 'audio',
        channel: 'music',
        action: 'play',
        cueKey: 'cold_night.soft_piano',
        next: 'cold_night.ambient',
      },
      {
        id: 'cold_night.ambient',
        type: 'audio',
        channel: 'ambient',
        action: 'play',
        cueKey: 'cold_night.low_wind',
        next: 'cold_night.camera',
      },
      {
        id: 'cold_night.camera',
        type: 'camera',
        cueKey: 'cold_night.greenhouse',
        next: 'cold_night.effects',
      },
      {
        id: 'cold_night.effects',
        type: 'effect',
        cueKey: 'cold_night.frost_breath_thermometer_warm_greenhouse',
        next: 'cold_night.narration.1',
      },
      {
        id: 'cold_night.narration.1',
        type: 'narration',
        speaker: 'robo',
        expression: 'concerned',
        textKey: 'cold_night.narration.1',
        next: 'cold_night.narration.2',
      },
      {
        id: 'cold_night.narration.2',
        type: 'narration',
        speaker: 'robo',
        expression: 'concerned',
        textKey: 'cold_night.narration.2',
        next: 'cold_night.narration.3',
      },
      {
        id: 'cold_night.narration.3',
        type: 'narration',
        speaker: 'robo',
        expression: 'concerned',
        textKey: 'cold_night.narration.3',
        next: 'cold_night.walk',
      },
      {
        id: 'cold_night.walk',
        type: 'walk',
        target: 'greenhouse',
        next: 'cold_night.dialogue.1',
      },
      {
        id: 'cold_night.dialogue.1',
        type: 'dialogue',
        speaker: 'mei',
        expression: 'concerned',
        textKey: 'cold_night.dialogue.1',
        next: 'cold_night.dialogue.2',
      },
      {
        id: 'cold_night.dialogue.2',
        type: 'dialogue',
        speaker: 'kai',
        expression: 'concerned',
        textKey: 'cold_night.dialogue.2',
        next: 'cold_night.question',
      },
      {
        id: 'cold_night.question',
        type: 'narration',
        speaker: 'robo',
        expression: 'thinking',
        textKey: 'cold_night.question',
        next: 'cold_night.choice',
      },
      {
        id: 'cold_night.choice',
        type: 'choice',
        eventId: 'cold_night',
        nextByChoice: {
          A: 'cold_night.result.A',
          B: 'cold_night.result.B',
          C: 'cold_night.result.C',
        },
      },
      {
        id: 'cold_night.result.A',
        type: 'result',
        eventId: 'cold_night',
        next: 'cold_night.after.A',
      },
      {
        id: 'cold_night.after.A',
        type: 'after',
        eventId: 'cold_night',
        choiceId: 'A',
        speaker: 'robo',
        expression: 'explaining',
        next: 'cold_night.real_card',
      },
      {
        id: 'cold_night.result.B',
        type: 'result',
        eventId: 'cold_night',
        next: 'cold_night.after.B',
      },
      {
        id: 'cold_night.after.B',
        type: 'after',
        eventId: 'cold_night',
        choiceId: 'B',
        speaker: 'robo',
        expression: 'explaining',
        next: 'cold_night.real_card',
      },
      {
        id: 'cold_night.result.C',
        type: 'result',
        eventId: 'cold_night',
        next: 'cold_night.after.C',
      },
      {
        id: 'cold_night.after.C',
        type: 'after',
        eventId: 'cold_night',
        choiceId: 'C',
        speaker: 'robo',
        expression: 'explaining',
        next: 'cold_night.real_card',
      },
      {
        id: 'cold_night.real_card',
        type: 'real_card',
        realMomentId: 'rm_cold',
        next: 'cold_night.classroom',
      },
      {
        id: 'cold_night.classroom',
        type: 'classroom_pause',
        questionKey: 'cold_night.classroom',
        next: 'cold_night.night',
      },
      {
        id: 'cold_night.night',
        type: 'night',
      },
    ],
  };

  if (!cargo.includes('greenhouse_kit')) return scene;
  const anchor = scene.steps.find(
    (step) => step.id === 'cold_night.dialogue.2',
  );
  if (!anchor || (anchor.type !== 'dialogue' && anchor.type !== 'after'))
    throw new TypeError('Missing cargo callback anchor.');
  const callback: SceneStep = {
    id: 'cold_night.cargo.greenhouse_kit',
    type: 'dialogue',
    speaker: 'mei',
    expression: 'neutral',
    textKey: 'cold_night.cargo.greenhouse_kit',
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
