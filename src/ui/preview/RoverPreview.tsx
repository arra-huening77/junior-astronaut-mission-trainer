import { useState } from 'react';
import { RoverDrive } from '../minigames/RoverDrive';

/**
 * Standalone Rover Drive harness.
 * Open /ui-preview.html?game=rover
 */
export function RoverPreview() {
  const [blocking, setBlocking] = useState(true);
  const [result, setResult] = useState<'done' | 'skipped' | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [round, setRound] = useState(0);

  return (
    <div className="ui-preview mg-preview">
      <details className="ui-preview__dev">
        <summary>Rover preview controls</summary>
        <div className="ui-preview__modes">
          <label>
            <input
              type="checkbox"
              checked={blocking}
              onChange={(e) => {
                setBlocking(e.target.checked);
                setResult(null);
                setRound((n) => n + 1);
              }}
            />
            obstacleBlocking
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
          <a href="/ui-preview.html">Scene</a>
          <a href="/ui-preview.html?game=panels">Cover Panels</a>
        </div>
        <p>
          Result: <code>{result ?? 'in progress'}</code> — UI only; no Life bonus here.
        </p>
      </details>

      <RoverDrive
        key={`${round}-${blocking}-${reduceMotion}`}
        id="rover_drive"
        instructionKey="minigame.rover_drive.hint"
        instruction="Guide the rover to the ice. Use the D-pad, arrow keys, or tap the next square."
        reduceMotion={reduceMotion}
        obstacleBlocking={blocking}
        sol={4}
        onResult={(value) => setResult(value)}
      />
    </div>
  );
}
