import type { SceneDefinition, SceneStep } from '../scene-types';
import type { CargoId } from '../types';

/** Approved script keys; costs, callbacks and bonuses resolve through events.json. */
export function createSol05Scene(
  cargo: readonly CargoId[] = [],
): SceneDefinition {
  const scene: SceneDefinition = {
    eventId: 'calling_earth',
    sol: 5,
    entryStepId: 'calling_earth.mood',
    steps: [
      {
        id: 'calling_earth.mood',
        type: 'scene',
        mood: 'dusk_night',
        next: 'calling_earth.music',
      },
      {
        id: 'calling_earth.music',
        type: 'audio',
        channel: 'music',
        action: 'play',
        cueKey: 'calling_earth.quiet_suspense',
        next: 'calling_earth.ambient',
      },
      {
        id: 'calling_earth.ambient',
        type: 'audio',
        channel: 'ambient',
        action: 'play',
        cueKey: 'calling_earth.radio_static',
        next: 'calling_earth.camera',
      },
      {
        id: 'calling_earth.camera',
        type: 'camera',
        cueKey: 'calling_earth.earth_dot',
        next: 'calling_earth.effects',
      },
      {
        id: 'calling_earth.effects',
        type: 'effect',
        cueKey: 'calling_earth.dish_signal_reply_in_24_story_minutes',
        next: 'calling_earth.narration.1',
      },
      {
        id: 'calling_earth.narration.1',
        type: 'narration',
        speaker: 'robo',
        expression: 'concerned',
        textKey: 'calling_earth.narration.1',
        next: 'calling_earth.narration.2',
      },
      {
        id: 'calling_earth.narration.2',
        type: 'narration',
        speaker: 'robo',
        expression: 'concerned',
        textKey: 'calling_earth.narration.2',
        next: 'calling_earth.narration.3',
      },
      {
        id: 'calling_earth.narration.3',
        type: 'narration',
        speaker: 'robo',
        expression: 'concerned',
        textKey: 'calling_earth.narration.3',
        next: 'calling_earth.walk',
      },
      {
        id: 'calling_earth.walk',
        type: 'walk',
        target: 'dish',
        next: 'calling_earth.dialogue.1',
      },
      {
        id: 'calling_earth.dialogue.1',
        type: 'dialogue',
        speaker: 'kai',
        expression: 'concerned',
        textKey: 'calling_earth.dialogue.1',
        next: 'calling_earth.dialogue.2',
      },
      {
        id: 'calling_earth.dialogue.2',
        type: 'dialogue',
        speaker: 'mei',
        expression: 'concerned',
        textKey: 'calling_earth.dialogue.2',
        next: 'calling_earth.question',
      },
      {
        id: 'calling_earth.question',
        type: 'narration',
        speaker: 'robo',
        expression: 'thinking',
        textKey: 'calling_earth.question',
        next: 'calling_earth.choice',
      },
      {
        id: 'calling_earth.choice',
        type: 'choice',
        eventId: 'calling_earth',
        nextByChoice: {
          A: 'calling_earth.wait.A',
          B: 'calling_earth.result.B',
          C: 'calling_earth.result.C',
        },
      },
      {
        id: 'calling_earth.wait.A',
        type: 'effect',
        cueKey: 'calling_earth.compressed_wait',
        next: 'calling_earth.reply.A',
      },
      {
        id: 'calling_earth.reply.A',
        type: 'dialogue',
        speaker: 'thiri',
        expression: 'happy',
        textKey: 'calling_earth.reply.A',
        next: 'calling_earth.result.A',
      },
      {
        id: 'calling_earth.result.A',
        type: 'result',
        eventId: 'calling_earth',
        next: 'calling_earth.after.A',
      },
      {
        id: 'calling_earth.after.A',
        type: 'after',
        eventId: 'calling_earth',
        choiceId: 'A',
        speaker: 'robo',
        expression: 'explaining',
        next: 'calling_earth.real_card',
      },
      {
        id: 'calling_earth.result.B',
        type: 'result',
        eventId: 'calling_earth',
        next: 'calling_earth.after.B',
      },
      {
        id: 'calling_earth.after.B',
        type: 'after',
        eventId: 'calling_earth',
        choiceId: 'B',
        speaker: 'robo',
        expression: 'explaining',
        next: 'calling_earth.real_card',
      },
      {
        id: 'calling_earth.result.C',
        type: 'result',
        eventId: 'calling_earth',
        next: 'calling_earth.after.C',
      },
      {
        id: 'calling_earth.after.C',
        type: 'after',
        eventId: 'calling_earth',
        choiceId: 'C',
        speaker: 'robo',
        expression: 'explaining',
        next: 'calling_earth.real_card',
      },
      {
        id: 'calling_earth.real_card',
        type: 'real_card',
        realMomentId: 'rm_signal_delay',
        next: 'calling_earth.classroom',
      },
      {
        id: 'calling_earth.classroom',
        type: 'classroom_pause',
        questionKey: 'calling_earth.classroom',
        next: 'calling_earth.night',
      },
      {
        id: 'calling_earth.night',
        type: 'night',
      },
    ],
  };

  if (!cargo.includes('radio_booster')) return scene;
  const anchor = scene.steps.find(
    (step) => step.id === 'calling_earth.after.A',
  );
  if (!anchor || (anchor.type !== 'dialogue' && anchor.type !== 'after'))
    throw new TypeError('Missing cargo callback anchor.');
  const callback: SceneStep = {
    id: 'calling_earth.cargo.radio_booster',
    type: 'dialogue',
    speaker: 'robo',
    expression: 'explaining',
    textKey: 'calling_earth.cargo.radio_booster',
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
