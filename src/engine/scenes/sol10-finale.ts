import type { SceneDefinition, SceneStep } from '../scene-types';

/** Success presentation is reachable only through the engine's final-night check. */
export function createSol10Scene(): SceneDefinition {
  const steps: SceneStep[] = [];
  function add(step: SceneStep) {
    const previous = steps.at(-1);
    if (previous && previous.type !== 'choice') previous.next = step.id;
    steps.push(step);
  }
  add({ id: 'finale.mood', type: 'scene', mood: 'finale_storm' });
  add({
    id: 'finale.music',
    type: 'audio',
    channel: 'music',
    action: 'play',
    cueKey: 'finale.storm_music',
  });
  add({
    id: 'finale.rumble',
    type: 'audio',
    channel: 'sfx',
    action: 'play',
    cueKey: 'finale.storm_rumble',
  });
  for (const cue of ['swirling_storm', 'flickering_lights'])
    add({ id: `finale.${cue}`, type: 'effect', cueKey: `finale.${cue}` });
  for (let n = 1; n <= 3; n++)
    add({
      id: `finale.narration.${n}`,
      type: 'narration',
      speaker: 'robo',
      expression: n === 3 ? 'cheering' : 'concerned',
      textKey: `finale.narration.${n}`,
    });
  add({
    id: 'finale.kai',
    type: 'dialogue',
    speaker: 'kai',
    expression: 'concerned',
    textKey: 'finale.dialogue.kai',
  });
  add({
    id: 'finale.mei',
    type: 'dialogue',
    speaker: 'mei',
    expression: 'concerned',
    textKey: 'finale.dialogue.mei',
  });
  add({
    id: 'finale.question',
    type: 'narration',
    speaker: 'robo',
    expression: 'thinking',
    textKey: 'finale.question',
  });
  add({
    id: 'finale.choice',
    type: 'choice',
    eventId: 'finale',
    nextByChoice: {
      A: 'finale.result.A',
      B: 'finale.result.B',
      C: 'finale.result.C',
    },
  });
  for (const choiceId of ['A', 'B', 'C'] as const)
    steps.push(
      {
        id: `finale.result.${choiceId}`,
        type: 'result',
        eventId: 'finale',
        next: `finale.after.${choiceId}`,
      },
      {
        id: `finale.after.${choiceId}`,
        type: 'after',
        eventId: 'finale',
        choiceId,
        speaker: 'robo',
        expression: 'explaining',
        next: 'finale.real_card',
      },
    );
  steps.push(
    {
      id: 'finale.real_card',
      type: 'real_card',
      realMomentId: 'rm_artemis',
      next: 'finale.classroom',
    },
    {
      id: 'finale.classroom',
      type: 'classroom_pause',
      questionKey: 'finale.classroom',
      next: 'finale.night',
    },
    { id: 'finale.night', type: 'night', next: 'finale.rumble_stop' },
    {
      id: 'finale.rumble_stop',
      type: 'audio',
      channel: 'sfx',
      action: 'stop',
      cueKey: 'finale.storm_rumble',
      next: 'finale.dawn',
    },
    {
      id: 'finale.dawn',
      type: 'scene',
      mood: 'finale_dawn',
      next: 'finale.sunrise',
    },
    {
      id: 'finale.sunrise',
      type: 'effect',
      cueKey: 'finale.sunrise_mount_sharp',
      next: 'finale.success_music',
    },
    {
      id: 'finale.success_music',
      type: 'audio',
      channel: 'music',
      action: 'play',
      cueKey: 'finale.success_music',
      next: 'finale.supply_ship',
    },
    {
      id: 'finale.supply_ship',
      type: 'effect',
      cueKey: 'finale.supply_ship_light',
      next: 'finale.fireworks',
    },
    {
      id: 'finale.fireworks',
      type: 'effect',
      cueKey: 'finale.success_fireworks',
      next: 'finale.thiri',
    },
    {
      id: 'finale.thiri',
      type: 'dialogue',
      speaker: 'thiri',
      expression: 'happy',
      textKey: 'finale.dialogue.thiri',
      next: 'finale.complete',
    },
    {
      id: 'finale.complete',
      type: 'dialogue',
      speaker: 'robo',
      expression: 'cheering',
      textKey: 'finale.dialogue.complete',
    },
  );
  return { eventId: 'finale', sol: 10, entryStepId: 'finale.mood', steps };
}
