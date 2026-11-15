import type { SceneDefinition, SceneStep } from '../scene-types';
import type { CargoId } from '../types';

/** Approved script keys; costs, callbacks and bonuses resolve through events.json. */
export function createSol04Scene(
  cargo: readonly CargoId[] = [],
): SceneDefinition {
  const scene: SceneDefinition = {
    eventId: 'ice_hunt',
    sol: 4,
    entryStepId: 'ice_hunt.mood',
    steps: [
      {
        id: 'ice_hunt.mood',
        type: 'scene',
        mood: 'calm_day',
        next: 'ice_hunt.music',
      },
      {
        id: 'ice_hunt.music',
        type: 'audio',
        channel: 'music',
        action: 'play',
        cueKey: 'ice_hunt.explorer',
        next: 'ice_hunt.ambient',
      },
      {
        id: 'ice_hunt.ambient',
        type: 'audio',
        channel: 'ambient',
        action: 'play',
        cueKey: 'ice_hunt.rover_motor',
        next: 'ice_hunt.camera',
      },
      {
        id: 'ice_hunt.camera',
        type: 'camera',
        cueKey: 'ice_hunt.curiosity_zoom',
        next: 'ice_hunt.effects',
      },
      {
        id: 'ice_hunt.effects',
        type: 'effect',
        cueKey: 'ice_hunt.clear_sky_rover_dust_trail_curiosity_sparkle',
        next: 'ice_hunt.narration.1',
      },
      {
        id: 'ice_hunt.narration.1',
        type: 'narration',
        speaker: 'robo',
        expression: 'explaining',
        textKey: 'ice_hunt.narration.1',
        next: 'ice_hunt.narration.2',
      },
      {
        id: 'ice_hunt.narration.2',
        type: 'narration',
        speaker: 'robo',
        expression: 'explaining',
        textKey: 'ice_hunt.narration.2',
        next: 'ice_hunt.narration.3',
      },
      {
        id: 'ice_hunt.narration.3',
        type: 'narration',
        speaker: 'robo',
        expression: 'explaining',
        textKey: 'ice_hunt.narration.3',
        next: 'ice_hunt.walk',
      },
      {
        id: 'ice_hunt.walk',
        type: 'walk',
        target: 'rover',
        next: 'ice_hunt.dialogue.1',
      },
      {
        id: 'ice_hunt.dialogue.1',
        type: 'dialogue',
        speaker: 'kai',
        expression: 'neutral',
        textKey: 'ice_hunt.dialogue.1',
        next: 'ice_hunt.dialogue.2',
      },
      {
        id: 'ice_hunt.dialogue.2',
        type: 'dialogue',
        speaker: 'robo',
        expression: 'explaining',
        textKey: 'ice_hunt.dialogue.2',
        next: 'ice_hunt.curiosity_beeps',
      },
      {
        id: 'ice_hunt.curiosity_beeps',
        type: 'audio',
        channel: 'sfx',
        action: 'play',
        cueKey: 'ice_hunt.curiosity_beeps',
        next: 'ice_hunt.dialogue.3',
      },
      {
        id: 'ice_hunt.dialogue.3',
        type: 'dialogue',
        speaker: 'robo',
        expression: 'explaining',
        textKey: 'ice_hunt.dialogue.3',
        next: 'ice_hunt.dialogue.4',
      },
      {
        id: 'ice_hunt.dialogue.4',
        type: 'dialogue',
        speaker: 'robo',
        expression: 'explaining',
        textKey: 'ice_hunt.dialogue.4',
        next: 'ice_hunt.question',
      },
      {
        id: 'ice_hunt.question',
        type: 'narration',
        speaker: 'robo',
        expression: 'thinking',
        textKey: 'ice_hunt.question',
        next: 'ice_hunt.choice',
      },
      {
        id: 'ice_hunt.choice',
        type: 'choice',
        eventId: 'ice_hunt',
        nextByChoice: {
          A: 'ice_hunt.task.A',
          B: 'ice_hunt.task.B',
          C: 'ice_hunt.result.C',
        },
      },
      {
        id: 'ice_hunt.task.A',
        type: 'mini_game',
        gameId: 'rover_drive',
        next: 'ice_hunt.result.A',
      },
      {
        id: 'ice_hunt.result.A',
        type: 'result',
        eventId: 'ice_hunt',
        next: 'ice_hunt.after.A',
      },
      {
        id: 'ice_hunt.after.A',
        type: 'after',
        eventId: 'ice_hunt',
        choiceId: 'A',
        speaker: 'robo',
        expression: 'explaining',
        next: 'ice_hunt.real_card',
      },
      {
        id: 'ice_hunt.task.B',
        type: 'mini_game',
        gameId: 'rover_drive',
        next: 'ice_hunt.result.B',
      },
      {
        id: 'ice_hunt.result.B',
        type: 'result',
        eventId: 'ice_hunt',
        next: 'ice_hunt.long_trip_shield',
      },
      {
        id: 'ice_hunt.long_trip_shield',
        type: 'effect',
        cueKey: 'ice_hunt.long_trip_shield_flicker',
        next: 'ice_hunt.after.B',
      },
      {
        id: 'ice_hunt.after.B',
        type: 'after',
        eventId: 'ice_hunt',
        choiceId: 'B',
        speaker: 'robo',
        expression: 'explaining',
        next: 'ice_hunt.real_card',
      },
      {
        id: 'ice_hunt.result.C',
        type: 'result',
        eventId: 'ice_hunt',
        next: 'ice_hunt.after.C',
      },
      {
        id: 'ice_hunt.after.C',
        type: 'after',
        eventId: 'ice_hunt',
        choiceId: 'C',
        speaker: 'robo',
        expression: 'explaining',
        next: 'ice_hunt.real_card',
      },
      {
        id: 'ice_hunt.real_card',
        type: 'real_card',
        realMomentId: 'rm_soil_water',
        next: 'ice_hunt.classroom',
      },
      {
        id: 'ice_hunt.classroom',
        type: 'classroom_pause',
        questionKey: 'ice_hunt.classroom',
        next: 'ice_hunt.night',
      },
      {
        id: 'ice_hunt.night',
        type: 'night',
      },
    ],
  };

  if (!cargo.includes('rover_fuel')) return scene;
  const anchor = scene.steps.find((step) => step.id === 'ice_hunt.after.B');
  if (!anchor || (anchor.type !== 'dialogue' && anchor.type !== 'after'))
    throw new TypeError('Missing cargo callback anchor.');
  const callback: SceneStep = {
    id: 'ice_hunt.cargo.rover_fuel',
    type: 'dialogue',
    speaker: 'kai',
    expression: 'happy',
    textKey: 'ice_hunt.cargo.rover_fuel',
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
