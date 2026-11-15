import { SAVE_SCHEMA_VERSION } from '../engine/contracts';
import type { DurableTransition, SaveEnvelope } from '../engine/contracts';
import { prepareForContinue, readSave } from '../engine/save-validation';
import type {
  SaveReadResult,
  SaveValidationOptions,
} from '../engine/save-validation';
import type { GameState } from '../engine/types';
import type { SceneCursor } from '../engine/scene-types';

export const MISSION_STORAGE_KEYS = {
  active: 'mms.activeRun',
  lastRun: 'mms.lastRun',
} as const;
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type StorageMode = 'persistent' | 'memory';
export type SaveWriteResult =
  | { kind: 'saved'; mode: StorageMode }
  | { kind: 'confirmation_required'; currentRunId: string }
  | { kind: 'invalid' | 'incompatible' | 'stale' };

export function createSaveEnvelope(input: {
  runId: string;
  state: GameState;
  checkpoint: DurableTransition;
  savedAt: string;
  cursor?: SceneCursor;
}): SaveEnvelope {
  return structuredClone({
    ...input,
    contentVersion: input.state.contentVersion,
    schemaVersion: SAVE_SCHEMA_VERSION,
  });
}

function progressRank(save: SaveEnvelope): number {
  const phase = save.state.phase;
  const offset =
    phase === 'ENDED'
      ? 3
      : phase === 'NIGHT'
        ? 2
        : phase === 'RESULT' || phase === 'REAL_CARD'
          ? 1
          : 0;
  return save.state.sol * 4 + offset;
}

function browserStorage(): StorageAdapter | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** Memory is authoritative after any storage error; a later read cannot revive a stale save. */
export function createMissionStorage(
  options: SaveValidationOptions & { storage?: StorageAdapter | null },
) {
  let adapter =
    options.storage === null
      ? undefined
      : (options.storage ?? browserStorage());
  let mode: StorageMode = adapter ? 'persistent' : 'memory';
  const memory = new Map<string, string | null>();

  function disablePersistence() {
    adapter = undefined;
    mode = 'memory';
  }
  function read(key: string): string | null {
    if (memory.has(key)) return memory.get(key) ?? null;
    try {
      const value = adapter?.getItem(key) ?? null;
      memory.set(key, value);
      return value;
    } catch {
      disablePersistence();
      return null;
    }
  }
  function write(key: string, value: string | null): void {
    memory.set(key, value);
    try {
      if (value === null) adapter?.removeItem(key);
      else adapter?.setItem(key, value);
    } catch {
      disablePersistence();
    }
  }
  function active(): SaveReadResult {
    const result = readSave(read(MISSION_STORAGE_KEYS.active), options);
    if (result.kind === 'ready' && result.save.state.phase === 'ENDED')
      return { kind: 'empty' };
    if (result.kind === 'ready') {
      const report = readSave(read(MISSION_STORAGE_KEYS.lastRun), options);
      if (
        report.kind === 'ready' &&
        report.save.state.phase === 'ENDED' &&
        report.save.runId === result.save.runId
      ) {
        return { kind: 'empty' };
      }
    }
    return result.kind === 'ready'
      ? { kind: 'ready', save: prepareForContinue(result.save) }
      : result;
  }

  return {
    get mode(): StorageMode {
      return mode;
    },
    loadActive: active,
    loadLastRun(): SaveReadResult {
      const result = readSave(read(MISSION_STORAGE_KEYS.lastRun), options);
      return result.kind === 'ready' && result.save.state.phase !== 'ENDED'
        ? { kind: 'empty' }
        : result;
    },
    clearActive(): void {
      write(MISSION_STORAGE_KEYS.active, null);
    },
    save(
      envelope: SaveEnvelope,
      input: { replaceUnfinished?: boolean; retrySol?: boolean } = {},
    ): SaveWriteResult {
      let serialized: string;
      try {
        serialized = JSON.stringify(envelope);
      } catch {
        return { kind: 'invalid' };
      }
      const checked = readSave(serialized, options);
      if (checked.kind !== 'ready')
        return {
          kind: checked.kind === 'incompatible' ? 'incompatible' : 'invalid',
        };
      const save = checked.save;
      const current = active();
      if (
        current.kind === 'ready' &&
        current.save.runId !== save.runId &&
        !input.replaceUnfinished
      ) {
        return {
          kind: 'confirmation_required',
          currentRunId: current.save.runId,
        };
      }
      if (
        current.kind === 'ready' &&
        current.save.runId === save.runId &&
        progressRank(save) < progressRank(current.save)
      ) {
        return { kind: 'stale' };
      }
      const report = readSave(read(MISSION_STORAGE_KEYS.lastRun), options);
      if (
        save.state.phase !== 'ENDED' &&
        report.kind === 'ready' &&
        report.save.runId === save.runId &&
        report.save.state.phase === 'ENDED'
      ) {
        if (
          !input.retrySol ||
          report.save.state.ending !== 'gentle' ||
          save.checkpoint !== 'sol_start' ||
          save.state.phase !== 'BRIEFING' ||
          save.state.sol !== report.save.state.sol
        )
          return { kind: 'stale' };
        const original = report.save.state;
        const sameCargo =
          [...original.cargo].sort().join() ===
          [...save.state.cargo].sort().join();
        const sameSky =
          original.sky &&
          save.state.sky &&
          Object.keys(original.sky).every(
            (key) =>
              original.sky?.[key as keyof typeof original.sky] ===
              save.state.sky?.[key as keyof typeof original.sky],
          );
        if (
          !sameCargo ||
          !sameSky ||
          original.missionDate !== save.state.missionDate
        )
          return { kind: 'invalid' };
        // Retrying resumes the same run. Clear its superseded failure report first.
        write(MISSION_STORAGE_KEYS.lastRun, null);
      }
      if (save.state.phase === 'ENDED') {
        write(MISSION_STORAGE_KEYS.lastRun, serialized);
        write(MISSION_STORAGE_KEYS.active, null);
      } else write(MISSION_STORAGE_KEYS.active, serialized);
      return { kind: 'saved', mode };
    },
  };
}
