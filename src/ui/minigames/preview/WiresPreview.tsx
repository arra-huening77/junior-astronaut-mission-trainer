import { useMemo, useState } from 'react';
import { RepairWires, type RepairWiresDifficulty } from '../RepairWires';

/**
 * Standalone Repair Wires harness (Member 2).
 * Open /minigames-c2-preview.html?game=wires
 */
export function WiresPreview() {
  const [result, setResult] = useState<'done' | 'skipped' | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [difficulty, setDifficulty] = useState<RepairWiresDifficulty>(1);
  const [round, setRound] = useState(0);

  const instruction = useMemo(() => {
    if (difficulty === 3) {
      return 'Training tier 3: match five pairs, route through free conduit rows, then test power.';
    }
    if (difficulty === 2) {
      return 'Training tier 2: match four pairs, pick a safe route for each line, then test power.';
    }
    return 'Choose a wire end, then its matching symbol. Connect all three pairs.';
  }, [difficulty]);

  return (
    <div className="ui-preview mg-preview">
      <details className="ui-preview__dev">
        <summary>Repair Wires preview controls</summary>
        <div className="ui-preview__modes">
          <label>
            Difficulty (preview only)
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(Number(e.target.value) as RepairWiresDifficulty)
              }
            >
              <option value={1}>Tier 1 — mission (3 pairs)</option>
              <option value={2}>Tier 2 — 4 pairs + routing</option>
              <option value={3}>Tier 3 — 5 pairs + conduits</option>
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
          <a href="/minigames-c2-preview.html?game=leak">Patch Leak</a>
        </div>
        <p>
          Result: <code>{result ?? 'in progress'}</code> — UI only; no Power
          bonus here.
        </p>
      </details>

      <RepairWires
        key={`${round}-${reduceMotion}-${difficulty}`}
        id="repair_wires"
        instructionKey="minigame.repair_wires.hint"
        instruction={instruction}
        reduceMotion={reduceMotion}
        sol={7}
        difficulty={difficulty}
        onResult={(value) => setResult(value)}
      />
    </div>
  );
}