import { getEventRules, rulesForSky } from './rules';
import { eventForSol } from './schedule';
import type { GameState } from './types';
import type { SceneCursor, SceneDefinition, SceneStep } from './scene-types';

function targets(step: SceneStep): string[] {
  return step.type === 'choice'
    ? Object.values(step.nextByChoice)
    : step.next
      ? [step.next]
      : [];
}

/** Reject broken routing before an authored timeline can run or restore a save. */
export function validateScene(scene: SceneDefinition): void {
  const expected = eventForSol(
    scene.sol,
    scene.eventId === 'leak' ? ['quickPatch'] : [],
  );
  if (scene.eventId !== expected)
    throw new TypeError('Scene does not match its fixed sol.');
  if (
    scene.eventId === 'solar_storm'
      ? !scene.variant
      : scene.variant !== undefined
  ) {
    throw new TypeError('Only solar scenes require a sky variant.');
  }
  const nodes = new Map(scene.steps.map((step) => [step.id, step]));
  if (
    !scene.steps.length ||
    nodes.size !== scene.steps.length ||
    !nodes.has(scene.entryStepId) ||
    scene.steps.some((step) => !step.id.trim())
  )
    throw new TypeError('Missing or duplicate scene step IDs.');
  const reachable = new Set<string>();
  const visiting = new Set<string>();
  function visit(id: string): void {
    if (visiting.has(id)) throw new TypeError('A scene timeline cannot loop.');
    if (reachable.has(id)) return;
    const step = nodes.get(id);
    if (!step) throw new TypeError(`Unknown scene target: ${id}`);
    visiting.add(id);
    if (
      step.type === 'choice' &&
      (Object.keys(step.nextByChoice).length !== 3 ||
        !['A', 'B', 'C'].every((key) => key in step.nextByChoice))
    )
      throw new TypeError('Missing choice route.');
    for (const next of targets(step)) visit(next);
    visiting.delete(id);
    reachable.add(id);
  }
  visit(scene.entryStepId);
  if (reachable.size !== nodes.size)
    throw new TypeError('Unreachable scene steps.');

  const choices = rulesForSky(
    getEventRules(scene.eventId),
    scene.variant ?? 'calm',
  ).choices;
  const presentationOnly = new Set([
    'scene',
    'camera',
    'effect',
    'audio',
    'narration',
    'dialogue',
    'classroom_pause',
  ]);
  function path(
    id: string,
    selected?: 'A' | 'B' | 'C',
    result = false,
    after = false,
    card = false,
    night = false,
    task = false,
  ): void {
    const step = nodes.get(id)!;
    if (night && !presentationOnly.has(step.type))
      throw new TypeError('Only presentation may follow committed night.');
    if (step.type === 'choice') {
      if (selected || step.eventId !== scene.eventId)
        throw new TypeError('Invalid or repeated event choice.');
      for (const choice of ['A', 'B', 'C'] as const)
        path(step.nextByChoice[choice], choice);
      return;
    }
    if (step.type === 'walk' && selected)
      throw new TypeError(
        'Interactive destination walking precedes choices; use effect cues for later movement.',
      );
    if (step.type === 'mini_game') {
      if (
        !selected ||
        result ||
        task ||
        choices.find((item) => item.id === selected)?.miniGame?.id !==
          step.gameId
      ) {
        throw new TypeError('Mini-game does not match the selected action.');
      }
      task = true;
    }
    if (step.type === 'result') {
      if (!selected || result || step.eventId !== scene.eventId)
        throw new TypeError('Invalid or repeated RESULT.');
      if (
        Boolean(choices.find((item) => item.id === selected)?.miniGame) !== task
      )
        throw new TypeError(
          'An attached mini-game needs its skippable timeline step.',
        );
      result = true;
    }
    if (step.type === 'after') {
      if (
        !result ||
        after ||
        step.eventId !== scene.eventId ||
        step.choiceId !== selected
      )
        throw new TypeError('After line does not match its committed choice.');
      after = true;
    }
    if (step.type === 'real_card') {
      if (!after || card)
        throw new TypeError(
          'A Real Mars invitation follows the After line once.',
        );
      card = true;
    }
    if (step.type === 'night') {
      if (!card || night)
        throw new TypeError('Night follows the card invitation once.');
      night = true;
    }
    if (step.next) path(step.next, selected, result, after, card, night, task);
    else if (!night)
      throw new TypeError('Each choice path must reach committed night.');
  }
  path(scene.entryStepId);
}

function key(eventId: string, variant?: string): string {
  return `${eventId}:${variant ?? 'base'}`;
}

export function createSceneRegistry(definitions: readonly SceneDefinition[]) {
  const scenes = new Map<string, SceneDefinition>();
  for (const definition of definitions) {
    validateScene(definition);
    const id = key(definition.eventId, definition.variant);
    if (scenes.has(id))
      throw new TypeError('Duplicate authored scene version.');
    scenes.set(id, structuredClone(definition));
  }
  return {
    resolve(state: GameState): SceneDefinition {
      const eventId = eventForSol(state.sol, state.flags);
      const scene = scenes.get(
        key(
          eventId,
          eventId === 'solar_storm' ? state.solarVariant : undefined,
        ),
      );
      if (!scene)
        throw new TypeError(`Scene content is not implemented: ${eventId}`);
      return structuredClone(scene);
    },
    isKnownCursor(cursor: SceneCursor): boolean {
      return Boolean(
        scenes
          .get(key(cursor.eventId, cursor.variant))
          ?.steps.some((step) => step.id === cursor.stepId),
      );
    },
  };
}
