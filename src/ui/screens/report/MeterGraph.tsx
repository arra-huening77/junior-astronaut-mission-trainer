import type { HistoryEntry, MeterId } from '../../../engine/types';

const COLORS: Record<MeterId, string> = {
  life: '#3aa0ff',
  power: '#f0c419',
  shield: '#9b6dff',
};

const LABELS: Record<MeterId, string> = {
  life: 'Life',
  power: 'Power',
  shield: 'Shield',
};

type MeterGraphProps = {
  history: HistoryEntry[];
  highlight?: MeterId | null;
};

/**
 * Simple SVG meter-by-sol graph. Presentation only — parent owns history numbers.
 */
export function MeterGraph({ history, highlight = null }: MeterGraphProps) {
  const width = 520;
  const height = 200;
  const pad = { top: 16, right: 16, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = Math.max(history.length, 1);

  function xAt(i: number) {
    return pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  }

  function yAt(value: number) {
    return pad.top + innerH * (1 - Math.max(0, Math.min(100, value)) / 100);
  }

  function pathFor(meter: MeterId) {
    return history
      .map((entry, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(entry.meters[meter]).toFixed(1)}`)
      .join(' ');
  }

  const meters: MeterId[] = ['life', 'power', 'shield'];

  return (
    <figure className="report-graph">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Meter values by sol">
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={yAt(tick)}
              y2={yAt(tick)}
              className="report-graph__grid"
            />
            <text x={pad.left - 8} y={yAt(tick) + 4} className="report-graph__tick" textAnchor="end">
              {tick}
            </text>
          </g>
        ))}

        {meters.map((meter) => (
          <path
            key={meter}
            d={pathFor(meter)}
            fill="none"
            stroke={COLORS[meter]}
            strokeWidth={highlight && highlight !== meter ? 2 : 3.5}
            opacity={highlight && highlight !== meter ? 0.35 : 1}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {history.map((entry, i) => (
          <text
            key={entry.sol}
            x={xAt(i)}
            y={height - 8}
            className="report-graph__sol"
            textAnchor="middle"
          >
            {entry.sol}
          </text>
        ))}
      </svg>
      <figcaption className="report-graph__legend">
        {(Object.keys(COLORS) as MeterId[]).map((meter) => (
          <span key={meter} className={highlight === meter ? 'is-hot' : undefined}>
            <i style={{ background: COLORS[meter] }} />
            {LABELS[meter]}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
