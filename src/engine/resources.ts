import { BALANCE } from './balance';
import { createLoadout } from './loadout';
import { getEventRules, rulesForSky } from './rules';
import { eventForSol } from './schedule';
import type {
  CargoId,
  ChoiceDefinition,
  ChoiceId,
  ChoiceResult,
  Effects,
  GameState,
  MeterId,
  Meters,
  MiniGameResult,
  Sol,
} from './types';

const METER_IDS: readonly MeterId[] = ['life', 'power', 'shield'];

function clampMeters(meters: Meters): void {
  for (const id of METER_IDS) {
    if (!Number.isFinite(meters[id]))
      throw new RangeError('Meters must remain finite.');
    meters[id] = Math.max(
      BALANCE.meterMin,
      Math.min(BALANCE.meterMax, meters[id]),
    );
  }
}

/** Actual meter drop determines simultaneous failure; exact ties use life/power/shield order. */
export function failedMeter(
  before: Meters,
  after: Meters,
): MeterId | undefined {
  let result: MeterId | undefined;
  let largestDrop = -Infinity;
  for (const meter of METER_IDS) {
    const drop = before[meter] - after[meter];
    if (after[meter] <= 0 && drop > largestDrop) {
      result = meter;
      largestDrop = drop;
    }
  }
  return result;
}

export function meterZone(value: number): 'ok' | 'low' | 'danger' | 'empty' {
  if (!Number.isFinite(value))
    throw new RangeError('Meter value must be finite.');
  if (value <= BALANCE.meterMin) return 'empty';
  if (value <= BALANCE.dangerAt) return 'danger';
  if (value <= BALANCE.warnAt) return 'low';
  return 'ok';
}

function applyEffects(state: GameState, effects: Effects): void {
  for (const id of METER_IDS) state.meters[id] += effects[id] ?? 0;
  state.science += effects.science ?? 0;
  state.solarPenalty += effects.solarPenalty ?? 0;
  state.flags = [...new Set([...state.flags, ...(effects.setFlags ?? [])])];
  if (effects.pending) {
    state.pending.push({
      appliesAtSol: state.sol + effects.pending.solsLater,
      effects: structuredClone(effects.pending.effects),
    });
  }
  // noScience is an authored research pause, not an extra Science deduction.
}

function checkFailure(state: GameState, before: Meters): void {
  const meter = failedMeter(before, state.meters);
  if (meter) {
    state.phase = 'ENDED';
    state.ending = 'gentle';
    state.failedMeter = meter;
  }
}

function solStart(state: GameState): GameState {
  const due = state.pending.filter((entry) => entry.appliesAtSol <= state.sol);
  state.pending = state.pending.filter(
    (entry) => entry.appliesAtSol > state.sol,
  );
  for (const entry of due) applyEffects(state, entry.effects);
  state.meters.power += state.modifiers.solarGain - state.solarPenalty;
  if (state.sol === 10 && state.flags.includes('plantsSuffered'))
    state.meters.life -= BALANCE.plantsLifeLoss;
  clampMeters(state.meters);
  state.schedule[state.sol - 1] = eventForSol(state.sol, state.flags);
  state.phase = 'BRIEFING';
  return state;
}

/** Launch bonuses and the first sol start commit atomically; a second Launch is ignored. */
export function launchMission(
  state: GameState,
  cargo: readonly CargoId[],
): GameState {
  if (state.phase !== 'PLAN') return state;
  if (!state.sky || state.sky.level !== state.solarVariant)
    throw new TypeError('Missing or inconsistent frozen sky.');
  const next = structuredClone(state);
  next.cargo = [...cargo];
  next.modifiers = createLoadout(cargo);
  for (const id of METER_IDS)
    next.meters[id] += next.modifiers.startBonus[id] ?? 0;
  clampMeters(next.meters);
  return solStart(next);
}

function currentChoice(state: GameState, id: ChoiceId): ChoiceDefinition {
  const event = getEventRules(eventForSol(state.sol, state.flags));
  const choice = rulesForSky(event, state.solarVariant).choices.find(
    (entry) => entry.id === id,
  );
  if (!choice) throw new RangeError('Unknown choice for current event.');
  return choice;
}

function projectedState(
  state: GameState,
  id: ChoiceId,
  miniGame?: MiniGameResult,
): { state: GameState; choice: ChoiceDefinition } {
  const choice = currentChoice(state, id);
  if (miniGame && !choice.miniGame)
    throw new TypeError('This choice has no mini-game.');
  if (miniGame !== undefined && miniGame !== 'done' && miniGame !== 'skipped')
    throw new TypeError('Invalid mini-game result.');
  const next = structuredClone(state);
  applyEffects(next, choice.effects);
  for (const cargo of state.cargo) {
    const adjustment = choice.ifCargo?.[cargo];
    if (adjustment) applyEffects(next, adjustment);
  }
  // Conditions use pre-choice flags, not flags set by this very choice.
  for (const flag of state.flags) {
    const adjustment = choice.ifFlags?.[flag];
    if (adjustment) applyEffects(next, adjustment);
  }
  if (miniGame === 'done' && choice.miniGame)
    applyEffects(next, choice.miniGame.bonus);
  clampMeters(next.meters);
  return { state: next, choice };
}

/** Caution preview assumes no optional completion bonus unless explicitly supplied. */
export function previewChoice(
  state: GameState,
  id: ChoiceId,
  miniGame?: MiniGameResult,
): { meters: Meters; failedMeter?: MeterId } {
  const { state: projected } = projectedState(state, id, miniGame);
  return {
    meters: projected.meters,
    failedMeter: failedMeter(state.meters, projected.meters),
  };
}

/** UI/scene player selects CHOICE/MINIGAME; this module owns committing the result. */
export function resolveChoice(
  state: GameState,
  id: ChoiceId,
  miniGame?: MiniGameResult,
): { state: GameState; result: ChoiceResult | null } {
  if (
    !['CHOICE', 'MINIGAME'].includes(state.phase) ||
    state.history.some((entry) => entry.sol === state.sol)
  ) {
    return { state, result: null };
  }
  if (state.phase === 'MINIGAME' && miniGame === undefined)
    throw new TypeError('An active task must finish or skip.');
  const { state: next, choice } = projectedState(state, id, miniGame);
  const eventId = eventForSol(state.sol, state.flags);
  next.phase = 'RESULT';
  next.history.push({
    sol: state.sol,
    eventId,
    choiceId: id,
    ...(miniGame ? { miniGame } : {}),
    meters: { ...next.meters },
  });
  checkFailure(next, state.meters);
  const result: ChoiceResult = {
    eventId,
    choiceId: id,
    ...(miniGame ? { miniGame } : {}),
    before: { ...state.meters },
    after: { ...next.meters },
    afterKey: choice.afterKey,
    ...(next.ending === 'gentle'
      ? { ending: 'gentle', failedMeter: next.failedMeter }
      : {}),
  };
  return { state: next, result };
}

/** Encountered cards are collected whether or not their optional photo is opened. */
export function encounterRealMoment(
  state: GameState,
  realMomentId: string,
): GameState {
  if (state.phase !== 'RESULT') return state;
  if (!realMomentId.trim())
    throw new TypeError('A real-moment ID is required.');
  const next = structuredClone(state);
  next.albumIds = [...new Set([...next.albumIds, realMomentId])];
  next.phase = 'REAL_CARD';
  return next;
}

/** NIGHT means upkeep is already committed; repeated Continue cannot charge it twice. */
export function finishNight(state: GameState): GameState {
  if (state.phase !== 'REAL_CARD') return state;
  const next = structuredClone(state);
  next.meters.life -= state.modifiers.lifeUpkeep;
  next.meters.power -= state.modifiers.baseLoad;
  clampMeters(next.meters);
  next.phase = 'NIGHT';
  checkFailure(next, state.meters);
  if (next.ending !== 'gentle' && state.sol === 10) {
    next.phase = 'ENDED';
    next.ending = 'success';
  }
  return next;
}

/** Sol-start effects occur once when leaving the preceding committed NIGHT. */
export function beginNextSol(state: GameState): GameState {
  if (state.phase !== 'NIGHT' || state.sol >= 10) return state;
  const next = structuredClone(state);
  next.sol = (state.sol + 1) as Sol;
  return solStart(next);
}
