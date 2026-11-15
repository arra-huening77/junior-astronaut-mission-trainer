import type { GameState } from './types';
import { createSceneRegistry } from './scene-registry';
import { createSol01Scene } from './scenes/sol01-touchdown';
import { createSol02Scene } from './scenes/sol02-first-night';
import { createSol03Scene } from './scenes/sol03-dust-warning';
import { createSol04Scene } from './scenes/sol04-ice-hunt';
import { createSol05Scene } from './scenes/sol05-calling-earth';
import { createSol06Scene } from './scenes/sol06-solar-encounter';
import { createSol07Scene } from './scenes/sol07-equipment-failure';
import { createSol08Scene } from './scenes/sol08-leak-or-meteors';
import { createSol09Scene } from './scenes/sol09-cold-night';
import { createSol10Scene } from './scenes/sol10-finale';

/** Thirteen authored versions; fixed routing consumes cargo, earlier repair and frozen NASA input. */
export function missionRegistry(state: GameState) {
  return createSceneRegistry([
    createSol01Scene(state.cargo),
    createSol02Scene(state.cargo),
    createSol03Scene(),
    createSol04Scene(state.cargo),
    createSol05Scene(state.cargo),
    ...(['calm', 'active', 'stormy'] as const).map((level) =>
      createSol06Scene(level, state.cargo),
    ),
    createSol07Scene(state.cargo, state.flags),
    createSol08Scene(['quickPatch']),
    createSol08Scene([]),
    createSol09Scene(state.cargo),
    createSol10Scene(),
  ]);
}
export function resolveMissionScene(state: GameState) {
  return missionRegistry(state).resolve(state);
}
