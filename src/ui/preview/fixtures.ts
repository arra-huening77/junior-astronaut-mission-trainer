import type { ChoiceOption, SceneLayerFlags } from '../components/types';
import type { Meters } from '../../engine/types';
import { MISSION_SPOTS } from '../components/outpostLayout';

/** Preview uses the production interaction layout. */
export const PREVIEW_SPOTS = MISSION_SPOTS;

export const PREVIEW_METERS: Meters = {
  life: 80,
  power: 70,
  shield: 60,
};

export const PREVIEW_LAYERS: SceneLayerFlags = {
  sky: 'day',
  solar: 'clean',
  garageOpen: false,
  shelterOpen: false,
  extraPanels: false,
  batteryBox: false,
  shieldPlating: false,
  frost: false,
};

export const PREVIEW_CHOICES: ChoiceOption[] = [
  { id: 'A', label: 'Check the habitat systems', costs: ['Power 0'] },
  { id: 'B', label: 'Send a status ping to Earth', costs: ['Power −5'] },
  {
    id: 'C',
    label: 'Rush the power test',
    costs: ['Power −10'],
    caution: true,
  },
];

export const PREVIEW_NOTES = [
  'Bottom-center anchors + depth scale; rover smaller; astronaut on the path.',
  'Decorative rocks are collision-resolved away from props (~20px / 2% clearance).',
  'No NASA logo in UI — team branding only.',
] as const;
