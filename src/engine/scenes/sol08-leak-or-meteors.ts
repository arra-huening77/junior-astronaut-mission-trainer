import type { FlagId } from '../types';
import type { SceneDefinition, SceneStep } from '../scene-types';

/** One Sol 8 slot: the earlier repair flag selects its authored version. */
export function createSol08Scene(
  flags: readonly FlagId[] = [],
): SceneDefinition {
  const eventId = flags.includes('quickPatch') ? 'leak' : 'meteors';
  const leak = eventId === 'leak';
  const steps: SceneStep[] = [];
  function add(step: SceneStep) {
    const previous = steps.at(-1);
    if (previous && previous.type !== 'choice') previous.next = step.id;
    steps.push(step);
  }
  add({
    id: `${eventId}.mood`,
    type: 'scene',
    mood: leak ? 'alarm_red' : 'meteors',
  });
  add({
    id: `${eventId}.music`,
    type: 'audio',
    channel: 'music',
    action: 'play',
    cueKey: `${eventId}.music`,
  });
  add({
    id: `${eventId}.sound`,
    type: 'audio',
    channel: 'sfx',
    action: 'play',
    cueKey: leak ? 'leak.gentle_siren' : 'meteors.whoosh',
  });
  // Decorative cues never apply a per-frame meter drain or an extra hazard cost.
  for (const cue of leak
    ? ['module_puffs', 'life_drip_visual', 'mei_patch_kit']
    : ['sky_streaks', 'ground_puffs', 'light_shake'])
    add({
      id: `${eventId}.${cue}`,
      type: 'effect',
      cueKey: `${eventId}.${cue}`,
    });
  for (let n = 1; n <= (leak ? 3 : 2); n++)
    add({
      id: `${eventId}.narration.${n}`,
      type: 'narration',
      speaker: 'robo',
      expression: leak ? 'concerned' : 'explaining',
      textKey: `${eventId}.narration.${n}`,
    });
  if (leak) {
    add({ id: 'leak.walk', type: 'walk', target: 'air' });
    add({
      id: 'leak.mei',
      type: 'dialogue',
      speaker: 'mei',
      expression: 'concerned',
      textKey: 'leak.dialogue.mei',
    });
  }
  add({
    id: `${eventId}.kai`,
    type: 'dialogue',
    speaker: 'kai',
    expression: 'neutral',
    textKey: `${eventId}.dialogue.kai`,
  });
  add({
    id: `${eventId}.question`,
    type: 'narration',
    speaker: 'robo',
    expression: 'thinking',
    textKey: `${eventId}.question`,
  });
  add({
    id: `${eventId}.choice`,
    type: 'choice',
    eventId,
    nextByChoice: {
      A: leak ? 'leak.patch_leak' : 'meteors.result.A',
      B: `${eventId}.result.B`,
      C: `${eventId}.result.C`,
    },
  });
  if (leak)
    steps.push({
      id: 'leak.patch_leak',
      type: 'mini_game',
      gameId: 'patch_leak',
      next: 'leak.result.A',
    });
  for (const choiceId of ['A', 'B', 'C'] as const)
    steps.push(
      {
        id: `${eventId}.result.${choiceId}`,
        type: 'result',
        eventId,
        next: `${eventId}.after.${choiceId}`,
      },
      {
        id: `${eventId}.after.${choiceId}`,
        type: 'after',
        eventId,
        choiceId,
        speaker: 'robo',
        expression: 'explaining',
        next: `${eventId}.sound_stop`,
      },
    );
  steps.push(
    {
      id: `${eventId}.sound_stop`,
      type: 'audio',
      channel: 'sfx',
      action: 'stop',
      cueKey: leak ? 'leak.gentle_siren' : 'meteors.whoosh',
      next: `${eventId}.real_card`,
    },
    {
      id: `${eventId}.real_card`,
      type: 'real_card',
      realMomentId: leak ? 'rm_leak' : 'rm_craters',
      next: `${eventId}.classroom`,
    },
    {
      id: `${eventId}.classroom`,
      type: 'classroom_pause',
      questionKey: `${eventId}.classroom`,
      next: `${eventId}.night`,
    },
    { id: `${eventId}.night`, type: 'night' },
  );
  return { eventId, sol: 8, entryStepId: `${eventId}.mood`, steps };
}
