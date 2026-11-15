import type { SceneDefinition, SceneStep } from '../engine/scene-types';
import type { ScenePlayback } from '../engine/scene-player';
import type { ChoiceId, MoodId } from '../engine/types';
import { resolveMissionScene } from '../engine/mission';
import type { SceneLayerFlags } from './components/types';
import { MISSION_SPOTS, OUTPOST_PATH_START } from './components/outpostLayout';

/** Follow only the chosen route, stopping at the current step when supplied. */
function visitedSteps(
  scene: SceneDefinition,
  selectedChoiceId?: ChoiceId,
  stopAt?: string,
) {
  const visited: SceneStep[] = [];
  let id: string | undefined = scene.entryStepId;
  for (let i = 0; id && i < scene.steps.length; i++) {
    const step = scene.steps.find((s) => s.id === id);
    if (!step) break;
    visited.push(step);
    if (step.id === stopAt) break;
    id =
      step.type === 'choice'
        ? selectedChoiceId
          ? step.nextByChoice[selectedChoiceId]
          : undefined
        : step.next;
  }
  return visited;
}

/** Rebuild presentation from the actual authored route; refreshing never replays resource effects. */
export function scenePresentation(
  scene: SceneDefinition,
  playback: ScenePlayback,
) {
  const visited = visitedSteps(
    scene,
    playback.cursor.selectedChoiceId,
    playback.cursor.stepId,
  );
  const mood =
    [...visited]
      .reverse()
      .find(
        (s): s is Extract<SceneStep, { type: 'scene' }> => s.type === 'scene',
      )?.mood ?? 'calm_day';
  const lastWalk = [...visited]
    .reverse()
    .find(
      (s): s is Extract<SceneStep, { type: 'walk' }> =>
        s.type === 'walk' &&
        (s.id !== playback.cursor.stepId || playback.game.phase === 'WALKING'),
    );
  // Completed history reconstructs the previous location even after Continue or
  // a sol retry, without adding presentation coordinates to the save contract.
  let stand: readonly number[] = [OUTPOST_PATH_START.x, OUTPOST_PATH_START.y];
  for (const entry of playback.game.history) {
    if (entry.sol >= playback.game.sol) continue;
    const previousScene = resolveMissionScene({
      ...playback.game,
      sol: entry.sol,
    });
    const previousWalk = visitedSteps(previousScene, entry.choiceId)
      .reverse()
      .find(
        (s): s is Extract<SceneStep, { type: 'walk' }> => s.type === 'walk',
      );
    if (previousWalk) stand = MISSION_SPOTS[previousWalk.target].stand;
  }
  if (lastWalk) stand = MISSION_SPOTS[lastWalk.target].stand;
  const sky: SceneLayerFlags['sky'] = [
    'dusk_night',
    'cold_night',
    'meteors',
  ].includes(mood)
    ? 'night'
    : ['dust_storm', 'finale_storm'].includes(mood)
      ? 'dust'
      : ['golden_dawn', 'finale_dawn'].includes(mood)
        ? 'dawn'
        : 'day';
  const layers: SceneLayerFlags = {
    sky,
    solar: playback.game.solarPenalty ? 'damaged' : 'clean',
    frost: mood === 'cold_night',
    garageOpen: scene.eventId === 'ice_hunt',
    shelterOpen: playback.game.ending === 'gentle',
  };
  if (
    scene.eventId === 'dust_storm' &&
    playback.cursor.selectedChoiceId === 'A'
  )
    layers.solar = 'covered';
  return {
    mood: mood as MoodId,
    layers,
    commander: { x: stand[0], y: stand[1] },
    cues: visited
      .filter((s) => s.type === 'camera' || s.type === 'effect')
      .map((s) => s.cueKey),
  };
}
