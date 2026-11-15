import type { SolStartSnapshot } from './contracts';
import { validateSolStartSnapshot } from './save-validation';
import type { GameState } from './types';
import type { SceneCursor } from './scene-types';

/** One active run/sol in memory. A fresh factory (browser reopen) has no retry snapshot. */
export function createRetrySession() {
  let captured: { runId: string; snapshot: SolStartSnapshot } | undefined;
  return {
    capture(runId: string, state: GameState, cursor: SceneCursor): void {
      if (state.phase !== 'BRIEFING')
        throw new TypeError(
          'Capture after sol-start effects, before presentation.',
        );
      if (!runId.trim()) throw new TypeError('Run ID is required.');
      captured = { runId, snapshot: validateSolStartSnapshot(state, cursor) };
    },
    restore(runId: string, failed: GameState): SolStartSnapshot | undefined {
      if (
        !captured ||
        captured.runId !== runId ||
        captured.snapshot.state.sol !== failed.sol ||
        failed.phase !== 'ENDED' ||
        failed.ending !== 'gentle'
      )
        return undefined;
      return structuredClone(captured.snapshot);
    },
    clear(): void {
      captured = undefined;
    },
  };
}
