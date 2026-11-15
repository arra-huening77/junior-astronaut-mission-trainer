import type { SkyResponse, SkyEvent } from '../../src/engine/contracts';
import type { SkySource } from '../../src/engine/types';
import {
  classifySkyFromDonki,
  type ClassifiedDonkiEvent,
  type DonkiObservationSet,
} from '../../src/engine/sky';
import type { DonkiWindow } from './donkiClient';

function flareClassFromDetails(details: string): string | undefined {
  const match = /class\s+([A-Za-z]\d+(?:\.\d+)?)/i.exec(details);
  return match?.[1];
}

function classifiedToSkyEvent(primary: ClassifiedDonkiEvent): SkyEvent | null {
  const observedAt = primary.eventDate?.trim();
  if (!observedAt) {
    return null;
  }

  const id =
    primary.eventId?.trim() || `${primary.observationType}-${observedAt}`;

  const skyEvent: SkyEvent = {
    id,
    type: primary.observationType,
    observedAt,
    sourceUrl: primary.sourceUrl?.trim() || 'https://api.nasa.gov/',
  };

  if (primary.observationType === 'FLR') {
    const classType = flareClassFromDetails(primary.details);
    if (classType) skyEvent.classType = classType;
  }

  if (primary.observationType === 'CME' && primary.details.includes('km/s')) {
    skyEvent.classType = primary.details;
  }

  return skyEvent;
}

export function buildSkyResponse(
  queryDate: string,
  window: DonkiWindow,
  observations: DonkiObservationSet,
  source: SkySource,
  fetchedAt: string,
): SkyResponse {
  const classified = classifySkyFromDonki(observations);
  if (!classified.ok) {
    throw new Error(`sky_input_unusable:${classified.reason}`);
  }
  const event = classified.primaryEvent
    ? classifiedToSkyEvent(classified.primaryEvent)
    : null;

  return {
    date: queryDate,
    level: classified.level,
    event,
    source,
    fetchedAt,
    windowStart: window.windowStart,
    windowEnd: window.windowEnd,
  };
}
