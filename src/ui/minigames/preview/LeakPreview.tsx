import { useMemo, useState } from 'react';
import { PatchLeak, type PatchLeakDifficulty } from '../PatchLeak';

/**
 * Standalone Patch Leak harness (Member 2).
 * Open /minigames-c2-preview.html?game=leak
 */
export function LeakPreview() {
  const [result, setResult] = useState<'done' | 'skipped' | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [difficulty, setDifficulty] = useState<PatchLeakDifficulty>(1);
  const [round, setRound] = useState(0);

  const instruction = useMemo(() => {
    if (difficulty === 3) {
      return 'Tier 3: scan for decoys, follow pressure order, rotate medium and large patches.';
    }
    if (difficulty === 2) {
      return 'Tier 2: scan S/M/L leaks, rotate large patches for slit shapes, then check pressure.';
    }
    return 'Scan each leak, choose Small or Large patches, then check pressure.';
  }, [difficulty]);

  return (
    <div className="ui-preview mg-preview">
      <details className="ui-preview__dev">
        <summary>Patch Leak preview controls</summary>
        <div className="ui-preview__modes">
          <label>
            Difficulty (preview only)
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(Number(e.target.value) as PatchLeakDifficulty)
              }
            >
              <option value={1}>Tier 1 — mission (3 leaks)</option>
              <option value={2}>Tier 2 — rotation + shapes</option>
              <option value={3}>Tier 3 — decoy + pressure order</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
            />
            Reduce Motion
          </label>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setRound((n) => n + 1);
            }}
          >
            reset
          </button>
          <a href="/minigames-c2-preview.html?game=wires">Repair Wires</a>
        </div>
        <p>
          Result: <code>{result ?? 'in progress'}</code> — UI only; no Power
          bonus here.
        </p>
      </details>

      <PatchLeak
        key={`${round}-${reduceMotion}-${difficulty}`}
        id="patch_leak"
        instructionKey="minigame.patch_leak.hint"
        instruction={instruction}
        reduceMotion={reduceMotion}
        sol={8}
        difficulty={difficulty}
        onResult={(value) => setResult(value)}
      />
    </div>
  );
}