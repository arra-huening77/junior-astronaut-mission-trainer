import type { CargoId, MoodId, SkyLevel } from '../types';
import type { SceneDefinition, SceneStep } from '../scene-types';

const MOODS: Record<SkyLevel, MoodId> = {
  calm: 'calm_day',
  active: 'alarm_amber',
  stormy: 'solar_storm',
};
const EFFECTS: Record<SkyLevel, readonly string[]> = {
  calm: ['shield_scan_blue', 'shield_green_once'],
  active: [
    'horizon_glow',
    'shield_amber_once',
    'sun_watch_banner',
    'kai_gauge',
  ],
  stormy: ['sky_glow', 'edge_pulse', 'crew_shelter', 'shield_sparkle'],
};

/** The caller supplies the frozen mission variant; this factory never fetches or samples. */
export function createSol06Scene(
  variant: SkyLevel,
  cargo: readonly CargoId[] = [],
): SceneDefinition {
  if (!['calm', 'active', 'stormy'].includes(variant))
    throw new TypeError('A frozen solar variant is required.');
  const prefix = `solar_storm.${variant}`;
  const steps: SceneStep[] = [];
  function add(step: SceneStep) {
    const previous = steps.at(-1);
    if (previous && previous.type !== 'choice') previous.next = step.id;
    steps.push(step);
  }
  add({ id: `${prefix}.mood`, type: 'scene', mood: MOODS[variant] });
  add({
    id: `${prefix}.music`,
    type: 'audio',
    channel: 'music',
    action: 'play',
    cueKey: `${prefix}.music`,
  });
  add({
    id: `${prefix}.detector`,
    type: 'audio',
    channel: 'sfx',
    action: 'play',
    cueKey: `${prefix}.detector`,
  });
  for (const cue of EFFECTS[variant])
    add({ id: `${prefix}.${cue}`, type: 'effect', cueKey: `${prefix}.${cue}` });
  for (let n = 1; n <= 3; n++)
    add({
      id: `${prefix}.narration.${n}`,
      type: 'narration',
      speaker: 'robo',
      expression: variant === 'calm' ? 'explaining' : 'concerned',
      textKey: `${prefix}.narration.${n}`,
    });
  add({
    id: `${prefix}.kai`,
    type: 'dialogue',
    speaker: 'kai',
    expression: variant === 'calm' ? 'neutral' : 'concerned',
    textKey: `${prefix}.dialogue.kai`,
  });
  if (variant === 'calm')
    add({
      id: `${prefix}.mei`,
      type: 'dialogue',
      speaker: 'mei',
      expression: 'neutral',
      textKey: `${prefix}.dialogue.mei`,
    });
  add({
    id: `${prefix}.thiri`,
    type: 'dialogue',
    speaker: 'thiri',
    expression: variant === 'calm' ? 'happy' : 'concerned',
    textKey: `${prefix}.dialogue.thiri`,
  });
  if (variant !== 'calm')
    add({
      id: `${prefix}.late_message`,
      type: 'dialogue',
      speaker: 'robo',
      expression: 'explaining',
      textKey: `${prefix}.dialogue.robo`,
    });
  if (cargo.includes('shield_plating'))
    add({
      id: `${prefix}.cargo.shield_plating`,
      type: 'dialogue',
      speaker: 'robo',
      expression: 'explaining',
      textKey: 'solar_storm.cargo.shield_plating',
    });
  add({
    id: `${prefix}.question`,
    type: 'narration',
    speaker: 'robo',
    expression: 'thinking',
    textKey: `${prefix}.question`,
  });
  add({
    id: `${prefix}.choice`,
    type: 'choice',
    eventId: 'solar_storm',
    nextByChoice: {
      A: `${prefix}.result.A`,
      B: `${prefix}.result.B`,
      C: `${prefix}.result.C`,
    },
  });
  for (const choiceId of ['A', 'B', 'C'] as const)
    steps.push(
      {
        id: `${prefix}.result.${choiceId}`,
        type: 'result',
        eventId: 'solar_storm',
        next: `${prefix}.after.${choiceId}`,
      },
      {
        id: `${prefix}.after.${choiceId}`,
        type: 'after',
        eventId: 'solar_storm',
        choiceId,
        speaker: 'robo',
        expression: 'explaining',
        next: `${prefix}.detector_stop`,
      },
    );
  steps.push(
    {
      id: `${prefix}.detector_stop`,
      type: 'audio',
      channel: 'sfx',
      action: 'stop',
      cueKey: `${prefix}.detector`,
      next: `${prefix}.real_card`,
    },
    {
      id: `${prefix}.real_card`,
      type: 'real_card',
      realMomentId: 'rm_solar_event',
      next: `${prefix}.classroom`,
    },
    {
      id: `${prefix}.classroom`,
      type: 'classroom_pause',
      questionKey: `${prefix}.classroom`,
      next: `${prefix}.night`,
    },
    { id: `${prefix}.night`, type: 'night' },
  );
  return {
    eventId: 'solar_storm',
    sol: 6,
    variant,
    entryStepId: `${prefix}.mood`,
    steps,
  };
}
