import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MiniGameProps } from '../../engine/scene-types';

type Vec = { x: number; y: number };
type Facing = 'up' | 'right' | 'down' | 'left';

type RoverDriveProps = Extract<MiniGameProps, { id: 'rover_drive' }> & {
  /** Parent resolves instructionKey from story.json */
  instruction: string;
  sol?: number;
};

const START: Vec = { x: 18, y: 68 };
const GOAL: Vec = { x: 82, y: 42 };
const STEP = 7;
const ROVER_R = 4.5;
const GOAL_R = 7;

/** Obstacle centers in % of the playfield. Leave a clear corridor to the goal. */
const ROCKS: { x: number; y: number; r: number; art: number }[] = [
  { x: 38, y: 58, r: 6, art: 2 },
  { x: 52, y: 70, r: 5, art: 1 },
  { x: 48, y: 40, r: 6.5, art: 2 },
  { x: 64, y: 55, r: 5.5, art: 0 },
  { x: 30, y: 42, r: 4.5, art: 1 },
  { x: 72, y: 68, r: 5, art: 2 },
];

const ROCK_ART = [
  '/assets/minigames/rock_small.png',
  '/assets/minigames/rock_medium.png',
  '/assets/minigames/rock_large.png',
] as const;

const DELTA: Record<Facing, Vec> = {
  up: { x: 0, y: -STEP },
  down: { x: 0, y: STEP },
  left: { x: -STEP, y: 0 },
  right: { x: STEP, y: 0 },
};

const FACE_FRAME: Record<Facing, number> = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function dist(a: Vec, b: Vec): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function hitsRock(pos: Vec): boolean {
  return ROCKS.some((rock) => dist(pos, rock) < rock.r + ROVER_R * 0.55);
}

/**
 * Open-terrain Rover Drive (no square grid).
 * Reports done|skipped once. Never awards Life.
 */
export function RoverDrive({
  instruction,
  reduceMotion,
  obstacleBlocking = true,
  onResult,
  sol = 4,
}: RoverDriveProps) {
  const titleId = useId();
  const finished = useRef(false);
  const [isFinished, setIsFinished] = useState(false);
  const [rover, setRover] = useState<Vec>(START);
  const [facing, setFacing] = useState<Facing>('right');
  const [activeDir, setActiveDir] = useState<Facing | null>(null);
  const [hint, setHint] = useState('Drive the rover to the target!');
  const [bump, setBump] = useState(false);
  const [dust, setDust] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [reached, setReached] = useState(0);

  const startDist = useMemo(() => dist(START, GOAL), []);
  const progress = Math.max(
    0,
    Math.min(
      100,
      Math.round(((startDist - dist(rover, GOAL)) / startDist) * 100),
    ),
  );

  const pathD = useMemo(() => {
    const midX = (rover.x + GOAL.x) / 2;
    const midY = Math.min(rover.y, GOAL.y) - 14;
    return `M ${rover.x} ${rover.y} Q ${midX} ${midY} ${GOAL.x} ${GOAL.y}`;
  }, [rover]);

  function finish(result: 'done' | 'skipped') {
    if (finished.current) return;
    finished.current = true;
    setIsFinished(true);
    if (result === 'done') {
      setReached(1);
      setCelebrating(true);
      setHint('You reached the target!');
    }
    onResult(result);
  }

  function tryStep(dir: Facing) {
    if (finished.current) return;
    setFacing(dir);
    setActiveDir(dir);
    window.setTimeout(() => setActiveDir(null), 140);

    const delta = DELTA[dir];
    const next = {
      x: clamp(rover.x + delta.x, 8, 92),
      y: clamp(rover.y + delta.y, 28, 88),
    };

    if (obstacleBlocking && hitsRock(next)) {
      setHint('Blocked by a rock — try another way!');
      if (!reduceMotion) {
        setBump(true);
        window.setTimeout(() => setBump(false), 300);
      }
      return;
    }

    setRover(next);
    setHint('Keep going — follow the path to the pad!');
    if (!reduceMotion) {
      setDust(true);
      window.setTimeout(() => setDust(false), 380);
    }

    if (dist(next, GOAL) <= GOAL_R) {
      finish('done');
    }
  }

  function goForward() {
    tryStep(facing);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('button, input, textarea, select, a')
      )
        return;
      if (finished.current) return;
      const map: Record<string, Facing | 'go'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
        Enter: 'go',
        ' ': 'go',
      };
      const action = map[event.key];
      if (!action) return;
      event.preventDefault();
      if (action === 'go') goForward();
      else tryStep(action);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section
      className={celebrating ? 'mg-rover mg-rover--won' : 'mg-rover'}
      aria-labelledby={titleId}
    >
      <div className="mg-rover__hud">
        <div
          className="mg-rover__chip mg-rover__chip--ghost"
          aria-hidden="true"
        >
          <span className="mg-rover__chip-icon">◎</span>
          Sol {sol}
        </div>

        <div className="mg-rover__title-card">
          <span className="mg-rover__title-icon" aria-hidden="true" />
          <div>
            <h2 id={titleId}>Rover Drive</h2>
            <p>Drive the rover to the target!</p>
          </div>
        </div>

        <div
          className="mg-rover__chip"
          aria-label={`Objectives ${reached} of 1`}
        >
          <span className="mg-rover__chip-flag" aria-hidden="true">
            ⚑
          </span>
          {reached} / 1
        </div>
      </div>

      <div
        className={[
          'mg-rover__playfield',
          bump ? 'mg-rover__playfield--bump' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="application"
        aria-label="Mars rover drive. Use arrow keys or on-screen controls, then GO."
      >
        <div className="mg-rover__vista" aria-hidden="true">
          <img src="/assets/bg/sky_day.png" alt="" draggable={false} />
          <div className="mg-rover__vista-shade" />
        </div>

        <svg
          className="mg-rover__path"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={pathD}
            className={
              reduceMotion
                ? 'mg-rover__path-line'
                : 'mg-rover__path-line mg-rover__path-line--flow'
            }
            fill="none"
          />
        </svg>

        {ROCKS.map((rock, index) => (
          <img
            key={`${rock.x}-${rock.y}-${index}`}
            className="mg-rover__rock"
            src={ROCK_ART[rock.art]}
            alt=""
            draggable={false}
            style={{
              left: `${rock.x}%`,
              top: `${rock.y}%`,
              width: `${rock.r * 2.4}%`,
            }}
          />
        ))}

        <div
          className={
            reduceMotion
              ? 'mg-rover__pad'
              : 'mg-rover__pad mg-rover__pad--pulse'
          }
          style={{ left: `${GOAL.x}%`, top: `${GOAL.y}%` }}
          aria-label="Target landing pad"
        >
          <span className="mg-rover__pad-flag" aria-hidden="true">
            ⚑
          </span>
        </div>

        <div
          className={[
            'mg-rover__rover',
            dust && !reduceMotion ? 'mg-rover__rover--dust' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            left: `${rover.x}%`,
            top: `${rover.y}%`,
            backgroundPosition: `${FACE_FRAME[facing] * (100 / 3)}% 0`,
          }}
          aria-label="Rover"
        />

        <p className="mg-rover__toast" role="status">
          {hint}
        </p>

        {celebrating ? (
          <div className="mg-rover__celebrate" role="status">
            <p>Target reached!</p>
            <span>Great driving, Commander.</span>
          </div>
        ) : null}
      </div>

      <div className="mg-rover__controls">
        <div
          className="mg-rover__dpad"
          role="group"
          aria-label="Direction controls"
        >
          <button
            type="button"
            className={
              activeDir === 'up'
                ? 'mg-dir mg-dir--active mg-dir--up'
                : 'mg-dir mg-dir--up'
            }
            aria-label="Move up"
            disabled={isFinished}
            onClick={() => tryStep('up')}
          >
            ▲
          </button>
          <button
            type="button"
            className={
              activeDir === 'left'
                ? 'mg-dir mg-dir--active mg-dir--left'
                : 'mg-dir mg-dir--left'
            }
            aria-label="Move left"
            disabled={isFinished}
            onClick={() => tryStep('left')}
          >
            ◀
          </button>
          <button
            type="button"
            className={
              activeDir === 'down'
                ? 'mg-dir mg-dir--active mg-dir--down'
                : 'mg-dir mg-dir--down'
            }
            aria-label="Move down"
            disabled={isFinished}
            onClick={() => tryStep('down')}
          >
            ▼
          </button>
          <button
            type="button"
            className={
              activeDir === 'right'
                ? 'mg-dir mg-dir--active mg-dir--right'
                : 'mg-dir mg-dir--right'
            }
            aria-label="Move right"
            disabled={isFinished}
            onClick={() => tryStep('right')}
          >
            ▶
          </button>
        </div>

        <div className="mg-rover__side">
          <p className="mg-rover__progress-label">Progress {progress}%</p>
          <p className="mg-rover__instruction">{instruction}</p>
          <div className="mg-rover__actions">
            <button
              type="button"
              className="mg-go"
              aria-label="Go forward"
              disabled={isFinished}
              onClick={goForward}
            >
              GO
            </button>
            <button
              type="button"
              className="mg-skip"
              disabled={isFinished}
              onClick={() => finish('skipped')}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
