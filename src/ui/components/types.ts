/**
 * UI-only presentation helpers. Domain IDs/meters/spots come from Gate A engine types.
 * Do not declare competing MeterId/SpotId unions here.
 */
export type {
  ChoiceId,
  MeterId,
  Meters,
  SkyLevel,
  SkySource,
  SpotId,
} from '../../engine/types';
export type {
  CrewExpression,
  RoboExpression,
  SpeakerPortrait,
} from '../../engine/scene-types';

import type { ChoiceId, Meters } from '../../engine/types';

export type MeterValues = Meters;

export type SpotLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Percent position for Commander feet [x, y] */
  stand: [number, number];
  label: string;
};

export type ChoiceOption = {
  id: ChoiceId;
  label: string;
  /** Short cost hints already resolved to display strings by the parent */
  costs?: string[];
  caution?: boolean;
  disabled?: boolean;
};

export type SceneLayerFlags = {
  sky: 'day' | 'dawn' | 'dusk' | 'night' | 'dust';
  solar: 'clean' | 'dusty' | 'covered' | 'damaged';
  garageOpen?: boolean;
  shelterOpen?: boolean;
  /** Visible when solar_extra cargo was packed. */
  extraPanels?: boolean;
  /** Visible when batteries cargo was packed. */
  batteryBox?: boolean;
  /** Visible when shield_plating cargo was packed. */
  shieldPlating?: boolean;
  frost?: boolean;
};

export type UiSettings = {
  reduceMotion: boolean;
  soundEnabled: boolean;
};
