import { meterZone } from '../../engine/resources';
import type { MeterId, Meters } from '../../engine/types';

const LABELS: Record<MeterId, string> = {
  life: 'Life Support',
  power: 'Power',
  shield: 'Shielding',
};

export type MeterWarning = {
  id: MeterId;
  zone: 'low' | 'danger' | 'empty';
  message: string;
};

/** Highest-severity meter warning for HUD banner (empty > danger > low). */
export function primaryMeterWarning(meters: Meters): MeterWarning | null {
  const order: MeterId[] = ['life', 'power', 'shield'];
  let best: MeterWarning | null = null;
  const rank = { low: 1, danger: 2, empty: 3 } as const;

  for (const id of order) {
    const zone = meterZone(meters[id]);
    if (zone === 'ok') continue;
    const message =
      zone === 'empty'
        ? `${LABELS[id]} is empty — the crew needs the shelter.`
        : zone === 'danger'
          ? `${LABELS[id]} is critically low!`
          : `${LABELS[id]} is getting low. Plan carefully.`;
    const candidate = { id, zone, message };
    if (!best || rank[candidate.zone] > rank[best.zone]) best = candidate;
  }
  return best;
}
