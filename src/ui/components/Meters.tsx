import { meterZone } from '../../engine/resources';
import type { MeterId, Meters as MeterValues } from '../../engine/types';

const METER_LABELS: Record<MeterId, string> = {
  life: 'Life Support',
  power: 'Power',
  shield: 'Shielding',
};

const METER_GLYPH: Record<MeterId, string> = {
  life: '💧',
  power: '⚡',
  shield: '🛡',
};

type MetersProps = {
  values: MeterValues;
  previous?: Partial<MeterValues>;
  reduceMotion?: boolean;
  /** Horizontal glass HUD row matching the layout reference */
  variant?: 'stack' | 'hud';
};

export function Meters({
  values,
  previous,
  reduceMotion = false,
  variant = 'hud',
}: MetersProps) {
  return (
    <div
      className={variant === 'hud' ? 'ui-meters ui-meters--hud' : 'ui-meters'}
      role="group"
      aria-label="Mission meters"
    >
      {(Object.keys(METER_LABELS) as MeterId[]).map((id) => {
        const value = clampMeter(values[id]);
        const from = previous?.[id];
        const zone = meterZone(values[id]);
        return (
          <div
            key={id}
            className={
              zone === 'ok' ? 'ui-meter' : `ui-meter ui-meter--${zone}`
            }
            data-meter={id}
            data-zone={zone}
          >
            <span className="ui-meter__icon" aria-hidden="true">
              {METER_GLYPH[id]}
            </span>
            <div className="ui-meter__copy">
              <span className="ui-meter__label">{METER_LABELS[id]}</span>
              <span className="ui-meter__value">{value}%</span>
            </div>
            <div
              className="ui-meter__track"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              aria-label={`${METER_LABELS[id]}${zone === 'ok' ? '' : `, ${zone}`}`}
            >
              <div
                className={
                  reduceMotion
                    ? 'ui-meter__fill'
                    : 'ui-meter__fill ui-meter__fill--animated'
                }
                style={{
                  width: `${value}%`,
                  ...(from !== undefined && !reduceMotion
                    ? { ['--meter-from' as string]: `${clampMeter(from)}%` }
                    : null),
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function clampMeter(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
