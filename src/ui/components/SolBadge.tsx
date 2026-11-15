type SolBadgeProps = {
  sol: number;
  phaseLabel?: string;
  clockLabel?: string;
};

export function SolBadge({ sol, phaseLabel = 'Day', clockLabel }: SolBadgeProps) {
  return (
    <div className="ui-sol-badge" aria-label={`Sol ${sol}, ${phaseLabel}${clockLabel ? `, ${clockLabel}` : ''}`}>
      <span className="ui-sol-badge__sun" aria-hidden="true">
        ☀
      </span>
      <div className="ui-sol-badge__text">
        <span className="ui-sol-badge__sol">
          Sol {sol}, {phaseLabel}
        </span>
        {clockLabel ? <span className="ui-sol-badge__clock">{clockLabel}</span> : null}
      </div>
    </div>
  );
}
