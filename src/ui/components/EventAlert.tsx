import type { EventAlertContent } from '../presentation/eventAlert';

type EventAlertProps = EventAlertContent & {
  reduceMotion?: boolean;
};

function HazardStripes({ side }: { side: 'left' | 'right' }) {
  return (
    <span className={`ui-event-alert__stripes ui-event-alert__stripes--${side}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

/** Sci-fi HUD alert banner shown when a hazard mood/event is active. */
export function EventAlert({ title, body, tone, reduceMotion = false }: EventAlertProps) {
  return (
    <div
      className={[
        'ui-event-alert',
        `ui-event-alert--${tone}`,
        reduceMotion ? '' : 'ui-event-alert--pulse',
      ]
        .filter(Boolean)
        .join(' ')}
      role="alert"
      aria-live="assertive"
    >
      <HazardStripes side="left" />
      <span className="ui-event-alert__icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="40" height="40" focusable="false">
          <path
            className="ui-event-alert__triangle"
            d="M24 6 L44 40 H4 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <text
            className="ui-event-alert__bang"
            x="24"
            y="34"
            textAnchor="middle"
            fontSize="18"
            fontWeight="800"
            fill="currentColor"
          >
            !
          </text>
        </svg>
      </span>
      <div className="ui-event-alert__copy">
        <p className="ui-event-alert__title">{title}</p>
        <p className="ui-event-alert__body">{body}</p>
      </div>
      <HazardStripes side="right" />
    </div>
  );
}
