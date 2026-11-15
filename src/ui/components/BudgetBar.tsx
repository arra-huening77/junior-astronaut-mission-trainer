type BudgetBarProps = {
  used: number;
  max: number;
  label?: string;
};

export function BudgetBar({ used, max, label = 'Cargo budget' }: BudgetBarProps) {
  const safeMax = Math.max(1, max);
  const pct = Math.max(0, Math.min(100, Math.round((used / safeMax) * 100)));
  const over = used > max;

  return (
    <div
      className={over ? 'ui-budget ui-budget--over' : 'ui-budget'}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={used}
    >
      <div className="ui-budget__copy">
        <span>{label}</span>
        <span>
          {used} / {max}
        </span>
      </div>
      <div className="ui-budget__track">
        <div className="ui-budget__fill" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
