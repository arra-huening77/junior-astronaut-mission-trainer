type SpinningMarsProps = {
  reduceMotion?: boolean;
};

/**
 * Textured Mars globe (NASA/USGS color map) that scrolls for a spinning look.
 * CSS-only so the prologue stays smooth on school devices.
 */
export function SpinningMars({ reduceMotion = false }: SpinningMarsProps) {
  return (
    <div
      className={
        reduceMotion
          ? 'prologue-mars prologue-mars--static'
          : 'prologue-mars'
      }
      aria-hidden="true"
    >
      <div className="prologue-mars__sphere" />
      <div className="prologue-mars__atmosphere" />
      <div className="prologue-mars__shade" />
    </div>
  );
}
