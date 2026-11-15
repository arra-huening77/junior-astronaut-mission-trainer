import type {
  CargoId,
  ChoiceId,
  EventId,
  GameState,
  MeterId,
  Meters,
  MiniGameResult,
  SkyLevel,
  SkySource,
  Sol,
} from './types';
import type { SceneCursor } from './scene-types';

/** Version of the storage envelope, not an assertion that all story facts are final. */
export const SAVE_SCHEMA_VERSION = 1 as const;

export interface SkyEvent {
  id: string;
  type: string;
  observedAt: string;
  sourceUrl: string;
  classType?: string;
}

/** GET /api/sky?date=YYYY-MM-DD. Observation times differ from fetch times. */
export interface SkyResponse {
  date: string;
  level: SkyLevel;
  event: SkyEvent | null;
  source: SkySource;
  fetchedAt: string;
  windowStart?: string;
  windowEnd?: string;
}

/** POST /api/debrief. Uses the README's event/choice wire names. */
export interface DebriefRequest {
  ending: 'success' | 'gentle';
  failedMeter: MeterId | null;
  skyLevel: SkyLevel;
  cargo: CargoId[];
  history: {
    sol: Sol;
    event: EventId;
    choice: ChoiceId;
    miniGame?: MiniGameResult;
    meters: Meters;
  }[];
  topDrains: { sol: Sol; meter: MeterId; amount: number }[];
  facts: string[];
}

export interface DebriefResponse {
  source: 'ai' | 'template';
  text: string;
}

export type DurableTransition =
  'launch' | 'sol_start' | 'choice_result' | 'night' | 'ending';

/** State is AFTER this transition. Loading must not replay it. */
export interface SaveEnvelope {
  runId: string;
  schemaVersion: typeof SAVE_SCHEMA_VERSION;
  contentVersion: string;
  savedAt: string;
  checkpoint: DurableTransition;
  state: GameState;
  cursor?: SceneCursor;
}

/** Session-only retry snapshot; do not write it into the durable save envelope. */
export interface SolStartSnapshot {
  state: GameState;
  cursor: SceneCursor;
}
