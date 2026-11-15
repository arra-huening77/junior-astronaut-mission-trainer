import type { CargoId, FlagId } from '../types';
import type { SceneDefinition, SceneStep } from '../scene-types';

/** Earlier decisions select authored copy; existing engine rules own every cost and flag. */
export function createSol07Scene(
  cargo: readonly CargoId[] = [],
  flags: readonly FlagId[] = [],
): SceneDefinition {
  const prefix = 'equipment_failure';
  const steps: SceneStep[] = [];
  function add(step: SceneStep) {
    const previous = steps.at(-1);
    if (previous && previous.type !== 'choice') previous.next = step.id;
    steps.push(step);
  }
  add({ id: `${prefix}.mood`, type: 'scene', mood: 'alarm_amber' });
  add({
    id: `${prefix}.music`,
    type: 'audio',
    channel: 'music',
    action: 'play',
    cueKey: `${prefix}.ticking_music`,
  });
  for (const cue of ['lights_flicker', 'panel_sparks', 'red_beacon'])
    add({ id: `${prefix}.${cue}`, type: 'effect', cueKey: `${prefix}.${cue}` });
  add({
    id: `${prefix}.narration.1`,
    type: 'narration',
    speaker: 'robo',
    expression: 'concerned',
    textKey: `${prefix}.narration.1`,
  });
  add({
    id: `${prefix}.narration.2`,
    type: 'narration',
    speaker: 'robo',
    expression: 'explaining',
    textKey: flags.includes('ignoredFlicker')
      ? `${prefix}.narration.flicker`
      : `${prefix}.narration.2`,
  });
  add({ id: `${prefix}.walk`, type: 'walk', target: 'solar' });
  add({
    id: `${prefix}.kai`,
    type: 'dialogue',
    speaker: 'kai',
    expression: 'concerned',
    textKey: `${prefix}.dialogue.kai`,
  });
  if (cargo.includes('spare_parts'))
    add({
      id: `${prefix}.cargo.spare_parts`,
      type: 'dialogue',
      speaker: 'kai',
      expression: 'happy',
      textKey: `${prefix}.cargo.spare_parts`,
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
    eventId: 'equipment_failure',
    nextByChoice: {
      A: `${prefix}.wrench`,
      B: `${prefix}.result.B`,
      C: `${prefix}.result.C`,
    },
  });
  steps.push(
    {
      id: `${prefix}.wrench`,
      type: 'effect',
      cueKey: `${prefix}.kai_wrench_gears`,
      next: `${prefix}.repair_wires`,
    },
    {
      id: `${prefix}.repair_wires`,
      type: 'mini_game',
      gameId: 'repair_wires',
      next: `${prefix}.result.A`,
    },
    {
      id: `${prefix}.result.A`,
      type: 'result',
      eventId: 'equipment_failure',
      next: `${prefix}.fixed`,
    },
    {
      id: `${prefix}.fixed`,
      type: 'effect',
      cueKey: `${prefix}.full_repair_complete`,
      next: `${prefix}.jingle`,
    },
    {
      id: `${prefix}.jingle`,
      type: 'audio',
      channel: 'sfx',
      action: 'play',
      cueKey: `${prefix}.repair_success`,
      next: `${prefix}.kai_fixed`,
    },
    {
      id: `${prefix}.kai_fixed`,
      type: 'dialogue',
      speaker: 'kai',
      expression: 'happy',
      textKey: `${prefix}.dialogue.kai_fixed`,
      next: `${prefix}.after.A`,
    },
    {
      id: `${prefix}.after.A`,
      type: 'after',
      eventId: 'equipment_failure',
      choiceId: 'A',
      speaker: 'robo',
      expression: 'explaining',
      next: `${prefix}.real_card`,
    },
    {
      id: `${prefix}.result.B`,
      type: 'result',
      eventId: 'equipment_failure',
      next: `${prefix}.after.B`,
    },
    {
      id: `${prefix}.after.B`,
      type: 'after',
      eventId: 'equipment_failure',
      choiceId: 'B',
      speaker: 'robo',
      expression: 'explaining',
      next: `${prefix}.real_card`,
    },
    {
      id: `${prefix}.result.C`,
      type: 'result',
      eventId: 'equipment_failure',
      next: `${prefix}.after.C`,
    },
    {
      id: `${prefix}.after.C`,
      type: 'after',
      eventId: 'equipment_failure',
      choiceId: 'C',
      speaker: 'robo',
      expression: 'explaining',
      next: `${prefix}.real_card`,
    },
    {
      id: `${prefix}.real_card`,
      type: 'real_card',
      realMomentId: 'rm_wheels',
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
    eventId: 'equipment_failure',
    sol: 7,
    entryStepId: `${prefix}.mood`,
    steps,
  };
}
