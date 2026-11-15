import { useEffect, useRef, type TransitionEvent } from 'react';

type CommanderPose = 'idle' | 'walk' | 'cheer' | 'concerned';

type CommanderProps = {
  /** Percent left/top for foot anchor */
  x: number;
  y: number;
  pose?: CommanderPose;
  facing?: 'left' | 'right';
  reduceMotion?: boolean;
  onArrived?: () => void;
};

const SHEETS: Record<CommanderPose, string> = {
  idle: '/assets/characters/commander_idle.png',
  walk: '/assets/characters/commander_walk.png',
  cheer: '/assets/characters/commander_cheer.png',
  concerned: '/assets/characters/commander_concerned.png',
};

/**
 * Map Commander sprite.
 * Gate A: physical cells 96×128, logical display 24×32; foot anchor from export manifest.
 */
export function Commander({
  x,
  y,
  pose = 'idle',
  facing = 'right',
  reduceMotion = false,
  onArrived,
}: CommanderProps) {
  const arrivedOnce = useRef(false);

  useEffect(() => {
    arrivedOnce.current = false;
  }, [x, y]);

  useEffect(() => {
    if (reduceMotion && onArrived && !arrivedOnce.current) {
      arrivedOnce.current = true;
      onArrived();
    }
  }, [reduceMotion, onArrived, x, y]);

  function handleTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== 'left') return;
    if (arrivedOnce.current) return;
    arrivedOnce.current = true;
    onArrived?.();
  }

  return (
    <div
      className={[
        'ui-commander',
        reduceMotion ? 'ui-commander--instant' : 'ui-commander--move',
        facing === 'left' ? 'ui-commander--flip' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: `${x}%`, top: `${y}%` }}
      onTransitionEnd={handleTransitionEnd}
      aria-hidden="true"
    >
      <div
        className={`ui-commander__sprite ui-commander__sprite--${pose}`}
        style={{ backgroundImage: `url(${SHEETS[pose]})` }}
      />
    </div>
  );
}
