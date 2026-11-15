import { useState } from 'react';
import { CoverPanels } from '../minigames/CoverPanels';

/**
 * Standalone Cover Panels harness.
 * Open /ui-preview.html?game=panels
 */
export function PanelsPreview() {
  const [result, setResult] = useState<'done' | 'skipped' | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [round, setRound] = useState(0);

  return (
    <div className="ui-preview mg-preview">
      <details className="ui-preview__dev">
        <summary>Cover Panels preview controls</summary>
        <div className="ui-preview__modes">
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
          <a href="/ui-preview.html">Scene</a>
          <a href="/ui-preview.html?game=rover">Rover</a>
        </div>
        <p>
          Result: <code>{result ?? 'in progress'}</code> — UI only; no Power bonus here.
        </p>
      </details>

      <CoverPanels
        key={`${round}-${reduceMotion}`}
        id="cover_panels"
        instructionKey="minigame.cover_panels.hint"
        instruction="Tap each solar panel (or press 1–4) to pull a cover over it before the dust arrives."
        reduceMotion={reduceMotion}
        sol={3}
        onResult={(value) => setResult(value)}
      />
    </div>
  );
}
