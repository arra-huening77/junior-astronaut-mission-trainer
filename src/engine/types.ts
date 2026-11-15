/** Shared domain vocabulary. Gameplay values/content remain in their owning data files. */
export const EVENT_IDS = [
  'touchdown',
  'first_night',
  'dust_storm',
  'ice_hunt',
  'calling_earth',
  'solar_storm',
  'equipment_failure',
  'leak',
  'meteors',
  'cold_night',
  'finale',
] as const;
export type EventId = (typeof EVENT_IDS)[number];
export type ChoiceId = 'A' | 'B' | 'C';
export type Sol = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type MeterId = 'life' | 'power' | 'shield';
export type Meters = Record<MeterId, number>;
export type SpotId =
  'habitat' | 'air' | 'greenhouse' | 'solar' | 'dish' | 'rover';
export type SkyLevel = 'calm' | 'active' | 'stormy';
export type SkySource = 'live' | 'cache' | 'saved';
export type CargoId =
  | 'solar_extra'
  | 'batteries'
  | 'shield_plating'
  | 'greenhouse_kit'
  | 'water_recycler'
  | 'spare_parts'
  | 'rover_fuel'
  | 'radio_booster';
export type MiniGameId =
  'cover_panels' | 'rover_drive' | 'repair_wires' | 'patch_leak';
export type MiniGameResult = 'done' | 'skipped';
export type FlagId =
  | 'ignoredFlicker'
  | 'quickPatch'
  | 'usedBackupO2'
  | 'plantsSuffered'
  | 'usedReserve';
export type MoodId =
  | 'calm_day'
  | 'golden_dawn'
  | 'dusk_night'
  | 'dust_storm'
  | 'solar_storm'
  | 'alarm_amber'
  | 'alarm_red'
  | 'meteors'
  | 'cold_night'
  | 'finale_storm'
  | 'finale_dawn';
export type Phase =
  | 'PLAN'
  | 'BRIEFING'
  | 'WALK_SELECT'
  | 'WALKING'
  | 'EVENT'
  | 'CHOICE'
  | 'MINIGAME'
  | 'RESULT'
  | 'REAL_CARD'
  | 'NIGHT'
  | 'ENDED';
export type TextKey = string;

export interface Effects {
  life?: number;
  power?: number;
  shield?: number;
  science?: number;
  noScience?: boolean;
  setFlags?: FlagId[];
  solarPenalty?: number;
  pending?: { solsLater: number; effects: Effects };
}

export interface Modifiers {
  solarGain: number;
  baseLoad: number;
  lifeUpkeep: number;
  startBonus: Partial<Meters>;
}

export interface FrozenSky {
  level: SkyLevel;
  source: SkySource;
  eventId?: string;
  observedAt?: string;
  fetchedAt: string;
  sourceUrl?: string;
}

export interface HistoryEntry {
  sol: Sol;
  eventId: EventId;
  choiceId: ChoiceId;
  miniGame?: MiniGameResult;
  meters: Meters;
}

/** No network, UI or random schedule state belongs here. */
export interface GameState {
  missionDate: string;
  contentVersion: string;
  schedule: EventId[];
  solarVariant: SkyLevel;
  sky?: FrozenSky;
  cargo: CargoId[];
  modifiers: Modifiers;
  sol: Sol;
  phase: Phase;
  meters: Meters;
  science: number;
  flags: FlagId[];
  solarPenalty: number;
  pending: { appliesAtSol: number; effects: Effects }[];
  history: HistoryEntry[];
  albumIds: string[];
  ending?: 'success' | 'gentle';
  failedMeter?: MeterId;
}

export interface CargoDefinition {
  id: CargoId;
  labelKey: TextKey;
  hintKey: TextKey;
  iconPath: string;
  weight: number;
  modifiers?: Partial<Omit<Modifiers, 'startBonus'>> & {
    startBonus?: Partial<Meters>;
  };
}

export interface ChoiceDefinition {
  id: ChoiceId;
  labelKey: TextKey;
  afterKey: TextKey;
  effects: Effects;
  ifCargo?: Partial<Record<CargoId, Effects>>;
  ifFlags?: Partial<Record<FlagId, Effects>>;
  miniGame?: { id: MiniGameId; bonus: Effects };
}

export interface EventVariant {
  mood: MoodId;
  narrationKey: TextKey;
  dialogueKeys: TextKey[];
  choices: [
    ChoiceDefinition & { id: 'A' },
    ChoiceDefinition & { id: 'B' },
    ChoiceDefinition & { id: 'C' },
  ];
  realMomentId: string;
  learnKey: TextKey;
}

export interface EventDefinition extends EventVariant {
  id: EventId;
  location?: SpotId;
  needsWalk: boolean;
  variants?: Record<SkyLevel, EventVariant>;
}

/** Produced only after the engine commits a choice, never by a mini-game. */
export interface ChoiceResult {
  eventId: EventId;
  choiceId: ChoiceId;
  miniGame?: MiniGameResult;
  before: Meters;
  after: Meters;
  afterKey: TextKey;
  ending?: 'gentle';
  failedMeter?: MeterId;
}
