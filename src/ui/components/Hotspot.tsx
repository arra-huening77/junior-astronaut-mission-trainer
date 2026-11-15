import type { SpotId, SpotLayout } from './types';

type HotspotProps = {
  id: SpotId;
  layout: SpotLayout;
  active?: boolean;
  enabled?: boolean;
  reduceMotion?: boolean;
  onSelect: (id: SpotId) => void;
};

/** Transparent percent-positioned spot button. Only call onSelect when parent enables WALK_SELECT. */
export function Hotspot({
  id,
  layout,
  active = false,
  enabled = true,
  reduceMotion = false,
  onSelect,
}: HotspotProps) {
  return (
    <button
      type="button"
      className={[
        'ui-hotspot',
        active ? 'ui-hotspot--active' : '',
        reduceMotion ? 'ui-hotspot--static' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: `${layout.x}%`,
        top: `${layout.y}%`,
        width: `${layout.w}%`,
        height: `${layout.h}%`,
      }}
      aria-label={layout.label}
      disabled={!enabled}
      onClick={() => {
        if (enabled) onSelect(id);
      }}
    />
  );
}
