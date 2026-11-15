import type {
  EventId,
  HistoryEntry,
  MeterId,
  Meters,
  Sol,
} from '../../../engine/types';

/** Preview-only copy. Member 3 replaces via story.json keys. */
export const ENDING_COPY = {
  successTitle: 'Mission complete!',
  successBody:
    'You kept the outpost running for 10 sols. Real mission planners balance air, power and protection just like this.',
  gentleTitle: 'The crew is safe',
  gentleLead:
    'The outpost has to power down, but the crew is safe in the emergency shelter, and the supply ship is on its way.',
  gentle: {
    life: 'Air and water ran very low, so the crew moved to the emergency shelter to wait for the supply ship.',
    power:
      'The batteries ran out, so the outpost powered down. The crew is safe in the shelter.',
    shield:
      'Protection ran too low, so the crew moved into the shelter to stay safe.',
  } satisfies Record<MeterId, string>,
  hint: {
    life: 'Try the ice hunt early, and watch the air.',
    power: 'Try saving power before a storm.',
    shield: "Don't skip the shield during a solar storm.",
  } satisfies Record<MeterId, string>,
} as const;

export const COMMANDER_STYLES = [
  'Careful Planner',
  'Brave Explorer',
  'Crew Protector',
] as const;

export type CommanderStyle = (typeof COMMANDER_STYLES)[number];

const EVENT_LABELS: Record<EventId, string> = {
  touchdown: 'Touchdown',
  first_night: 'First Night',
  dust_storm: 'Dust Storm Warning',
  ice_hunt: 'Ice Hunt',
  calling_earth: 'Calling Earth',
  solar_storm: 'Solar Encounter',
  equipment_failure: 'Equipment Fault',
  leak: 'Habitat Leak',
  meteors: 'Meteor Watch',
  cold_night: 'Cold Night',
  finale: 'Final Day',
};

export function eventLabel(eventId: EventId): string {
  return EVENT_LABELS[eventId] ?? eventId;
}

function meters(life: number, power: number, shield: number): Meters {
  return { life, power, shield };
}

function entry(
  sol: Sol,
  eventId: EventId,
  choiceId: HistoryEntry['choiceId'],
  life: number,
  power: number,
  shield: number,
): HistoryEntry {
  return { sol, eventId, choiceId, meters: meters(life, power, shield) };
}

/** Success fixture — all meters stay up across 10 sols. */
export const SUCCESS_HISTORY: HistoryEntry[] = [
  entry(1, 'touchdown', 'A', 78, 70, 62),
  entry(2, 'first_night', 'B', 74, 62, 60),
  entry(3, 'dust_storm', 'A', 70, 58, 58),
  entry(4, 'ice_hunt', 'A', 78, 52, 56),
  entry(5, 'calling_earth', 'B', 74, 55, 54),
  entry(6, 'solar_storm', 'A', 70, 50, 68),
  entry(7, 'equipment_failure', 'A', 66, 48, 66),
  entry(8, 'leak', 'B', 72, 42, 64),
  entry(9, 'cold_night', 'A', 68, 40, 62),
  entry(10, 'finale', 'A', 64, 45, 60),
];

/** Gentle fixture — Power drains to 0 on Sol 7. */
export const GENTLE_HISTORY: HistoryEntry[] = [
  entry(1, 'touchdown', 'C', 76, 68, 58),
  entry(2, 'first_night', 'A', 70, 55, 55),
  entry(3, 'dust_storm', 'C', 66, 40, 52),
  entry(4, 'ice_hunt', 'B', 62, 28, 50),
  entry(5, 'calling_earth', 'C', 58, 18, 48),
  entry(6, 'solar_storm', 'C', 54, 10, 40),
  entry(7, 'equipment_failure', 'C', 50, 0, 38),
];

export const TEMPLATE_DEBRIEF_SUCCESS =
  'You saved power before the dust hit, then topped up Life on the ice hunt. That balance kept every meter above empty through Sol 10. Next time, try one new cargo pack and compare the graph.';

export const TEMPLATE_DEBRIEF_GENTLE =
  'Power dropped hardest after the dust warning and the long ice trip. The crew is safe in the shelter. Next time, try saving power before a storm.';
