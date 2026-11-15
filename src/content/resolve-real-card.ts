import type { EventId, SkyLevel } from '../engine/types';
import factCopy from './fact-copy.json';
import { getMediaCatalog } from './media-catalog';

export type ResolvedRealCard = {
  id: string;
  eventId: EventId;
  title: string;
  fact: string;
  sourceLabel: string;
  sourceUrl: string;
  photoSrc: string;
  photoAlt: string;
  photoCredit: string;
  savedLabel: string;
  imageType: 'photo' | 'diagram' | 'illustration';
  contextNote?: string;
};

type FactEntry = {
  wording: string;
  sourceUrl: string;
  sourceLabel: string;
};

const FACTS = factCopy as Record<string, FactEntry>;

/**
 * Resolve a real-moment ID into UI card props from the media catalog + fact copy.
 * Solar cards may swap supporting educational fact text by frozen sky level.
 */
export function resolveRealCard(
  realMomentId: string,
  options?: { skyLevel?: SkyLevel },
): ResolvedRealCard | null {
  const { photos, realMoments } = getMediaCatalog();
  const moment = realMoments[realMomentId];
  if (!moment) return null;

  const photo = photos[moment.photoId];
  if (!photo) return null;

  const factId =
    moment.variants && options?.skyLevel
      ? (moment.variants[options.skyLevel]?.factId ?? moment.factId)
      : moment.factId;
  const fact = FACTS[factId];
  if (!fact) return null;

  const contextNote = moment.contextNote ?? photo.contextNote;

  return {
    id: realMomentId,
    eventId: moment.eventId,
    title: moment.title,
    fact: fact.wording,
    sourceLabel: fact.sourceLabel,
    sourceUrl: photo.sourceUrl || fact.sourceUrl,
    photoSrc: photo.src,
    photoAlt: photo.altText,
    photoCredit: photo.credit,
    savedLabel: photo.savedLabel,
    imageType: photo.imageType,
    ...(contextNote ? { contextNote } : {}),
  };
}

/** Resolve every catalogued real moment (album / print / preview). */
export function resolveAllRealCards(options?: {
  skyLevel?: SkyLevel;
}): ResolvedRealCard[] {
  const { realMoments } = getMediaCatalog();
  return Object.keys(realMoments)
    .map((id) => resolveRealCard(id, options))
    .filter((card): card is ResolvedRealCard => card !== null);
}

/** Resolve only IDs already encountered in a run. */
export function resolveAlbumCards(
  albumIds: readonly string[],
  options?: { skyLevel?: SkyLevel },
): ResolvedRealCard[] {
  return albumIds
    .map((id) => resolveRealCard(id, options))
    .filter((card): card is ResolvedRealCard => card !== null);
}
