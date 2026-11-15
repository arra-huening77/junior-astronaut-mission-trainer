import type { SceneCue } from '../../engine/scene-player';
import type { MoodId } from '../../engine/types';
import type { SceneLayerFlags } from '../components/types';

export type CuePresentation = {
  mood: MoodId | null;
  sky: SceneLayerFlags['sky'];
  tintClassName: string;
  frost: boolean;
};

export const DEFAULT_CUE_PRESENTATION: CuePresentation = {
  mood: null,
  sky: 'dawn', // Sol 1 golden_dawn → day terrain + dawn tint (dawn asset has no ground)
  tintClassName: 'ui-mood--dawn',
  frost: false,
};

function skyForMood(mood: MoodId): SceneLayerFlags['sky'] {
  switch (mood) {
    case 'dusk_night':
    case 'cold_night':
      return 'night';
    case 'dust_storm':
      return 'dust';
    case 'golden_dawn':
    case 'finale_dawn':
      return 'dawn';
    case 'solar_storm':
    case 'alarm_amber':
    case 'alarm_red':
    case 'meteors':
    case 'finale_storm':
      return 'dusk';
    case 'calm_day':
    default:
      return 'day';
  }
}

function tintForMood(mood: MoodId): string {
  switch (mood) {
    case 'dust_storm':
      return 'ui-mood--dust';
    case 'solar_storm':
    case 'finale_storm':
      return 'ui-mood--solar';
    case 'alarm_amber':
      return 'ui-mood--amber';
    case 'alarm_red':
      return 'ui-mood--red';
    case 'cold_night':
      return 'ui-mood--cold';
    case 'meteors':
      return 'ui-mood--meteors';
    case 'dusk_night':
      return 'ui-mood--dusk';
    case 'golden_dawn':
    case 'finale_dawn':
      return 'ui-mood--dawn';
    default:
      return '';
  }
}

/** Fold one transition's cues into lasting presentation state (consume once per transition). */
export function foldCues(
  cues: readonly SceneCue[],
  previous: CuePresentation = DEFAULT_CUE_PRESENTATION,
): CuePresentation {
  let next = previous;
  for (const cue of cues) {
    if (cue.type !== 'mood') continue;
    next = {
      mood: cue.mood,
      sky: skyForMood(cue.mood),
      tintClassName: tintForMood(cue.mood),
      frost: cue.mood === 'cold_night',
    };
  }
  return next;
}
