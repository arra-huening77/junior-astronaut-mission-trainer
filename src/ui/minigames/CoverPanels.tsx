import { useEffect, useId, useRef, useState } from 'react';
import type { MiniGameResult, TextKey } from '../../engine/types';

type CoverPanelsProps = {
  id: 'cover_panels';
  reduceMotion: boolean;
  instructionKey: TextKey;
  /** Parent resolves instructionKey from story.json */
  instruction: string;
  onResult: (result: MiniGameResult) => void;
  sol?: number;
};

const PANEL_COUNT = 4;

/**
 * Cover Panels mini-game — tap all four panels to cover them.
 * Reports done|skipped once. Never awards Power — engine owns +2 Power.
 */
export function CoverPanels({
  instruction,
  reduceMotion,
  onResult,
  sol = 3,
}: CoverPanelsProps) {
  const titleId = useId();
  const finished = useRef(false);
  const [isFinished, setIsFinished] = useState(false);
  const [covered, setCovered] = useState<boolean[]>(() =>
    Array.from({ length: PANEL_COUNT }, () => false),
  );
  const [focusIndex, setFocusIndex] = useState(0);
  const [hint, setHint] = useState(
    'Tap each glowing panel to pull its cover over.',
  );
  const [celebrating, setCelebrating] = useState(false);

  const doneCount = covered.filter(Boolean).length;

  function finish(result: 'done' | 'skipped') {
    if (finished.current) return;
    finished.current = true;
    setIsFinished(true);
    if (result === 'done') {
      setCelebrating(true);
      setHint('All panels covered — nice work!');
    }
    onResult(result);
  }

  function coverAt(index: number) {
    if (finished.current) return;
    setFocusIndex(index);
    setCovered((prev) => {
      if (prev[index]) {
        setHint('That panel is already covered. Try another one!');
        return prev;
      }
      const next = prev.map((value, i) => (i === index ? true : value));
      const count = next.filter(Boolean).length;
      if (count >= PANEL_COUNT) {
        setHint('All panels covered — nice work!');
        window.setTimeout(() => finish('done'), reduceMotion ? 0 : 220);
      } else {
        setHint(`Covered ${count} of ${PANEL_COUNT}. Keep going!`);
      }
      return next;
    });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('button, input, textarea, select, a')
      )
        return;
      if (finished.current) return;
      if (event.key >= '1' && event.key <= '4') {
        event.preventDefault();
        coverAt(Number(event.key) - 1);
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusIndex((i) => (i + 1) % PANEL_COUNT);
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusIndex((i) => (i - 1 + PANEL_COUNT) % PANEL_COUNT);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        coverAt(focusIndex);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section
      className={celebrating ? 'mg-panels mg-panels--won' : 'mg-panels'}
      aria-labelledby={titleId}
    >
      <div className="mg-panels__hud">
        <div className="mg-panels__chip">Sol {sol}</div>
        <div className="mg-panels__title-card">
          <span className="mg-panels__title-icon" aria-hidden="true" />
          <div>
            <h2 id={titleId}>Cover Panels</h2>
            <p>Protect the solar panels from the dust!</p>
          </div>
        </div>
        <div
          className="mg-panels__chip"
          aria-label={`Covered ${doneCount} of ${PANEL_COUNT}`}
        >
          {doneCount} / {PANEL_COUNT}
        </div>
      </div>

      <div className="mg-panels__stage">
        <div
          className="mg-panels__field"
          role="group"
          aria-label="Solar panels. Press 1 to 4, or use arrows and Enter."
        >
          {covered.map((isCovered, index) => (
            <button
              key={`panel-${index}`}
              type="button"
              className={[
                'mg-panels__slot',
                isCovered
                  ? 'mg-panels__slot--covered'
                  : 'mg-panels__slot--open',
                focusIndex === index ? 'mg-panels__slot--focus' : '',
                !isCovered && !reduceMotion ? 'mg-panels__slot--glow' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={
                isCovered
                  ? `Panel ${index + 1}, covered`
                  : `Panel ${index + 1}, tap to cover`
              }
              aria-pressed={isCovered}
              disabled={isFinished}
              onClick={() => coverAt(index)}
              onFocus={() => setFocusIndex(index)}
            >
              <span className="mg-panels__number" aria-hidden="true">
                {index + 1}
              </span>
              <img
                className="mg-panels__art"
                src="/assets/minigames/panel.png"
                alt=""
                draggable={false}
              />
              <img
                className={[
                  'mg-panels__cover',
                  isCovered ? 'mg-panels__cover--on' : '',
                  reduceMotion ? 'mg-panels__cover--instant' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                src="/assets/minigames/panel_cover.png"
                alt=""
                draggable={false}
              />
            </button>
          ))}
        </div>

        <p className="mg-panels__toast" role="status">
          {hint}
        </p>

        {celebrating ? (
          <div className="mg-panels__celebrate" role="status">
            <p>Panels safe!</p>
            <span>Dust protection is ready.</span>
          </div>
        ) : null}
      </div>

      <div className="mg-panels__footer">
        <p className="mg-panels__instruction">{instruction}</p>
        <button
          type="button"
          className="mg-skip"
          disabled={isFinished}
          onClick={() => finish('skipped')}
        >
          Skip
        </button>
      </div>
    </section>
  );
}
