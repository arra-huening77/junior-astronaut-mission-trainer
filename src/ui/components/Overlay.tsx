import { useEffect, useRef, useState, type ReactNode } from 'react';

const TINT_FADE_MS = 1000;
const FADE_TICK_MS = 32;

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

type OverlayProps = {
  kind?: 'frost' | 'none';
  tintClassName?: string;
  reduceMotion?: boolean;
  children?: ReactNode;
};

/** Decorative mood/effect layer. Always pointer-events: none. */
export function Overlay({
  kind = 'none',
  tintClassName,
  reduceMotion = false,
  children,
}: OverlayProps) {
  const target = tintClassName ?? '';
  const [baseTint, setBaseTint] = useState(target);
  const [fadeTint, setFadeTint] = useState<string | null>(null);
  const [fadeAmount, setFadeAmount] = useState(0);
  const baseRef = useRef(target);

  const [frostOn, setFrostOn] = useState(kind === 'frost');
  const [frostOpacity, setFrostOpacity] = useState(kind === 'frost' ? 1 : 0);
  const frostTarget = kind === 'frost' ? 1 : 0;

  useEffect(() => {
    if (reduceMotion) {
      baseRef.current = target;
      setBaseTint(target);
      setFadeTint(null);
      setFadeAmount(0);
      return;
    }

    if (target === baseRef.current) {
      setFadeTint(null);
      setFadeAmount(0);
      return;
    }

    setFadeTint(target);
    setFadeAmount(0);
    const start = performance.now();
    let timer = 0;

    const tick = () => {
      const t = smoothstep((performance.now() - start) / TINT_FADE_MS);
      setFadeAmount(t);
      if (t >= 1) {
        baseRef.current = target;
        setBaseTint(target);
        setFadeTint(null);
        setFadeAmount(0);
        return;
      }
      timer = window.setTimeout(tick, FADE_TICK_MS);
    };
    timer = window.setTimeout(tick, FADE_TICK_MS);

    return () => window.clearTimeout(timer);
  }, [target, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setFrostOn(frostTarget === 1);
      setFrostOpacity(frostTarget);
      return;
    }

    if (frostTarget === 1) setFrostOn(true);
    if (frostTarget === 0 && frostOpacity === 0) {
      setFrostOn(false);
      return;
    }
    if (
      (frostTarget === 1 && frostOpacity >= 1) ||
      (frostTarget === 0 && frostOpacity <= 0 && !frostOn)
    ) {
      return;
    }

    const from = frostOpacity;
    const start = performance.now();
    let timer = 0;

    const tick = () => {
      const t = smoothstep((performance.now() - start) / TINT_FADE_MS);
      const next = from + (frostTarget - from) * t;
      setFrostOpacity(next);
      if (t >= 1) {
        setFrostOpacity(frostTarget);
        if (frostTarget === 0) setFrostOn(false);
        return;
      }
      timer = window.setTimeout(tick, FADE_TICK_MS);
    };
    timer = window.setTimeout(tick, FADE_TICK_MS);

    return () => window.clearTimeout(timer);
    // Intentionally drive from kind changes; frostOpacity is the animated value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frostTarget, reduceMotion]);

  return (
    <div
      className={['ui-overlay', reduceMotion ? 'ui-overlay--calm' : '']
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <div
        className={['ui-overlay__tint', baseTint].filter(Boolean).join(' ')}
        style={{ opacity: fadeTint !== null ? 1 - fadeAmount : 1 }}
      />
      {fadeTint !== null ? (
        <div
          className={['ui-overlay__tint', fadeTint].filter(Boolean).join(' ')}
          style={{ opacity: fadeAmount }}
        />
      ) : null}
      {frostOn ? (
        <img
          className="ui-overlay__frost"
          src="/assets/overlays/frost_corners.png"
          alt=""
          draggable={false}
          style={{ opacity: frostOpacity }}
        />
      ) : null}
      {children}
    </div>
  );
}
