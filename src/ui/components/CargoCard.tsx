type CargoCardProps = {
  id: string;
  name: string;
  description: string;
  iconSrc: string;
  mass: number;
  selected?: boolean;
  disabled?: boolean;
  overBudget?: boolean;
  onToggle?: (id: string) => void;
};

/** Plan-phase cargo item. Selection only — loadout rules stay in the engine. */
export function CargoCard({
  id,
  name,
  description,
  iconSrc,
  mass,
  selected = false,
  disabled = false,
  overBudget = false,
  onToggle,
}: CargoCardProps) {
  return (
    <button
      type="button"
      className={[
        'ui-cargo-card',
        selected ? 'ui-cargo-card--selected' : '',
        overBudget ? 'ui-cargo-card--over-budget' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => onToggle?.(id)}
    >
      <img
        className="ui-cargo-card__icon"
        src={iconSrc}
        alt=""
        draggable={false}
      />
      <span className="ui-cargo-card__name">{name}</span>
      <span className="ui-cargo-card__desc">{description}</span>
      <span className="ui-cargo-card__mass">Weight {mass}</span>
      {overBudget && (
        <span className="ui-cargo-card__limit">
          Not enough space — tap for Robo’s advice
        </span>
      )}
    </button>
  );
}
