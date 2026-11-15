import story from './story.json';
import sol02 from './sol02-first-night.json';
import sol03 from './sol03-dust-warning.json';
import sol04 from './sol04-ice-hunt.json';
import sol05 from './sol05-calling-earth.json';
import sol06 from './sol06-solar-encounter.json';
import sol07 from './sol07-equipment-failure.json';
import sol08 from './sol08-leak-or-meteors.json';
import sol09 from './sol09-cold-night.json';
import sol10 from './sol10-finale.json';

import { eventForSol } from '../engine/schedule';
import { createSol01Scene } from '../engine/scenes/sol01-touchdown';
import { createSol02Scene } from '../engine/scenes/sol02-first-night';
import { createSol03Scene } from '../engine/scenes/sol03-dust-warning';
import { createSol04Scene } from '../engine/scenes/sol04-ice-hunt';
import { createSol05Scene } from '../engine/scenes/sol05-calling-earth';
import { createSol06Scene } from '../engine/scenes/sol06-solar-encounter';
import { createSol07Scene } from '../engine/scenes/sol07-equipment-failure';
import { createSol08Scene } from '../engine/scenes/sol08-leak-or-meteors';
import { createSol09Scene } from '../engine/scenes/sol09-cold-night';
import { createSol10Scene } from '../engine/scenes/sol10-finale';
import type { SceneDefinition } from '../engine/scene-types';
import type { GameState } from '../engine/types';

/** Merged runtime story keys for all authored sols (Sol 1 lives in story.json). */
export const missionText: Record<string, string> = {
  ...(story as Record<string, string>),
  ...(sol02 as Record<string, string>),
  ...(sol03 as Record<string, string>),
  ...(sol04 as Record<string, string>),
  ...(sol05 as Record<string, string>),
  ...(sol06 as Record<string, string>),
  ...(sol07 as Record<string, string>),
  ...(sol08 as Record<string, string>),
  ...(sol09 as Record<string, string>),
  ...(sol10 as Record<string, string>),
};

export function missionTextLookup(key: string): string {
  return missionText[key] ?? 'Content is not ready yet.';
}

/**
 * Build the authored scene for the current mission state.
 * Cargo/flag/solar variant callbacks are applied here; the registry alone is not enough.
 */
export function buildSceneForState(state: GameState): SceneDefinition {
  const eventId = eventForSol(state.sol, state.flags);
  switch (eventId) {
    case 'touchdown':
      return createSol01Scene(state.cargo);
    case 'first_night':
      return createSol02Scene(state.cargo);
    case 'dust_storm':
      return createSol03Scene();
    case 'ice_hunt':
      return createSol04Scene(state.cargo);
    case 'calling_earth':
      return createSol05Scene(state.cargo);
    case 'solar_storm':
      return createSol06Scene(state.solarVariant, state.cargo);
    case 'equipment_failure':
      return createSol07Scene(state.cargo, state.flags);
    case 'leak':
    case 'meteors':
      return createSol08Scene(state.flags);
    case 'cold_night':
      return createSol09Scene(state.cargo);
    case 'finale':
      return createSol10Scene();
    default: {
      const _exhaustive: never = eventId;
      throw new TypeError(`Unknown mission event: ${_exhaustive}`);
    }
  }
}
