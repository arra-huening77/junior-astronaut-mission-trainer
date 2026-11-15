import type { GameState, MeterId, Sol, EventId, ChoiceId } from './types';
import type { DebriefRequest } from './contracts';
import { createMission } from './state';
import {
  beginNextSol,
  finishNight,
  launchMission,
  resolveChoice,
} from './resources';
import { resolveAlbum } from '../content/mission-content';
export type ChoiceDrain = {
  sol: Sol;
  eventId: EventId;
  choiceId: ChoiceId;
  meter: MeterId;
  amount: number;
};
/** Replays authored rules to recover actual before/after choice costs, never assuming a 100-point start. */
export function choiceDrains(game: GameState): ChoiceDrain[] {
  if (!game.sky) return [];
  let replay = launchMission(
    createMission({
      missionDate: game.missionDate,
      contentVersion: game.contentVersion,
      sky: game.sky,
    }),
    game.cargo,
  );
  const drains: ChoiceDrain[] = [];
  for (const entry of game.history) {
    replay = { ...replay, phase: 'CHOICE' };
    const resolved = resolveChoice(replay, entry.choiceId, entry.miniGame);
    if (!resolved.result) break;
    for (const meter of ['life', 'power', 'shield'] as const) {
      const amount =
        resolved.result.before[meter] - resolved.result.after[meter];
      if (amount > 0)
        drains.push({
          sol: entry.sol,
          eventId: entry.eventId,
          choiceId: entry.choiceId,
          meter,
          amount,
        });
    }
    if (resolved.state.ending) break;
    replay = beginNextSol(
      finishNight({ ...resolved.state, phase: 'REAL_CARD' }),
    );
  }
  return drains.sort((a, b) => b.amount - a.amount);
}
export function debriefPayload(game: GameState): DebriefRequest {
  return {
    ending: game.ending ?? 'gentle',
    failedMeter: game.failedMeter ?? null,
    skyLevel: game.solarVariant,
    cargo: [...game.cargo],
    history: game.history.map((h) => ({
      sol: h.sol,
      event: h.eventId,
      choice: h.choiceId,
      meters: h.meters,
      ...(h.miniGame ? { miniGame: h.miniGame } : {}),
    })),
    topDrains: choiceDrains(game)
      .slice(0, 3)
      .map((d) => ({ sol: d.sol, meter: d.meter, amount: d.amount })),
    facts: resolveAlbum(game)
      .slice(-3)
      .map((c) => c.fact),
  };
}
