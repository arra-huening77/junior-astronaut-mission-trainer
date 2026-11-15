import type { CargoId } from '../types';
import type { SceneDefinition, SceneStep } from '../scene-types';

/** Approved writing lives in story.json; resource effects remain in events.json. */
export function createSol01Scene(
  cargo: readonly CargoId[] = [],
): SceneDefinition {
  const steps: SceneStep[] = [];
  const add = (step: SceneStep) => {
    const previous = steps.at(-1);
    if (previous && previous.type !== 'choice') previous.next = step.id;
    steps.push(step);
  };
  add({ id: 'touchdown.mood', type: 'scene', mood: 'golden_dawn' });
  add({
    id: 'touchdown.music',
    type: 'audio',
    channel: 'music',
    action: 'play',
    cueKey: 'touchdown.golden_dawn',
  });
  for (let n = 1; n <= 6; n++)
    add({
      id: `touchdown.prologue.${n}`,
      type: 'narration',
      speaker: 'robo',
      expression: 'explaining',
      textKey: `prologue.${n}`,
    });
  add({ id: 'touchdown.pan', type: 'camera', cueKey: 'touchdown.outpost_pan' });
  add({
    id: 'touchdown.dust',
    type: 'effect',
    cueKey: 'touchdown.landing_dust',
  });
  for (let n = 1; n <= 3; n++)
    add({
      id: `touchdown.narration.${n}`,
      type: 'narration',
      speaker: 'robo',
      expression: 'cheering',
      textKey: `touchdown.narration.${n}`,
    });
  add({
    id: 'touchdown.meters',
    type: 'effect',
    cueKey: 'touchdown.meters_reveal',
  });
  add({
    id: 'touchdown.walk_hint',
    type: 'dialogue',
    speaker: 'robo',
    expression: 'explaining',
    textKey: 'touchdown.walk_hint',
  });
  add({ id: 'touchdown.walk', type: 'walk', target: 'habitat' });
  add({
    id: 'touchdown.robo',
    type: 'dialogue',
    speaker: 'robo',
    expression: 'explaining',
    textKey: 'touchdown.dialogue.robo',
  });
  add({
    id: 'touchdown.kai',
    type: 'dialogue',
    speaker: 'kai',
    expression: 'neutral',
    textKey: 'touchdown.dialogue.kai',
  });
  add({
    id: 'touchdown.mei',
    type: 'dialogue',
    speaker: 'mei',
    expression: 'happy',
    textKey: 'touchdown.dialogue.mei',
  });
  // One applicable callback, not an inventory recital or an extra modifier.
  const callback = cargo.includes('solar_extra')
    ? 'solar_extra'
    : cargo.includes('water_recycler')
      ? 'water_recycler'
      : cargo.includes('greenhouse_kit')
        ? 'greenhouse_kit'
        : undefined;
  if (callback)
    add({
      id: `touchdown.cargo.${callback}`,
      type: 'dialogue',
      speaker: callback === 'greenhouse_kit' ? 'mei' : 'robo',
      expression: callback === 'greenhouse_kit' ? 'happy' : 'explaining',
      textKey: `touchdown.cargo.${callback}`,
    } as SceneStep);
  add({
    id: 'touchdown.question',
    type: 'narration',
    speaker: 'robo',
    expression: 'thinking',
    textKey: 'touchdown.question',
  });
  add({
    id: 'touchdown.choice',
    type: 'choice',
    eventId: 'touchdown',
    nextByChoice: {
      A: 'touchdown.result.A',
      B: 'touchdown.result.B',
      C: 'touchdown.result.C',
    },
  });
  for (const choiceId of ['A', 'B', 'C'] as const)
    steps.push(
      {
        id: `touchdown.result.${choiceId}`,
        type: 'result',
        eventId: 'touchdown',
        next: `touchdown.after.${choiceId}`,
      },
      {
        id: `touchdown.after.${choiceId}`,
        type: 'after',
        eventId: 'touchdown',
        choiceId,
        speaker: 'robo',
        expression: 'explaining',
        next: 'touchdown.real_card',
      },
    );
  steps.push(
    {
      id: 'touchdown.real_card',
      type: 'real_card',
      realMomentId: 'rm_gale',
      next: 'touchdown.classroom',
    },
    {
      id: 'touchdown.classroom',
      type: 'classroom_pause',
      questionKey: 'touchdown.classroom',
      next: 'touchdown.night',
    },
    { id: 'touchdown.night', type: 'night' },
  );
  return { eventId: 'touchdown', sol: 1, entryStepId: 'touchdown.mood', steps };
}
