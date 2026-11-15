import type { SkyLevel, SkySource } from '../../engine/types';

type SkyBadgeProps = {
  level?: SkyLevel;
  status: SkySource | 'Unavailable';
  observationDate?: string;
};

const STATUS_LABEL: Record<SkyBadgeProps['status'], string> = {
  live: 'Live',
  cache: 'Cached',
  saved: 'Saved',
  Unavailable: 'Unavailable',
};

export function SkyBadge({ level, status, observationDate }: SkyBadgeProps) {
  return (
    <div className="ui-sky-badge" aria-label={`NASA sky ${STATUS_LABEL[status]}${level ? `, ${level}` : ''}`}>
      <span className="ui-sky-badge__status">{STATUS_LABEL[status]}</span>
      {level ? <span className="ui-sky-badge__level">{level}</span> : null}
      {observationDate ? (
        <span className="ui-sky-badge__date">{observationDate}</span>
      ) : null}
    </div>
  );
}
