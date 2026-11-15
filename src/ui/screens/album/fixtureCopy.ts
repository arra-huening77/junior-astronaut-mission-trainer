import type { EventId } from '../../../engine/types';
import {
  resolveAllRealCards,
  type ResolvedRealCard,
} from '../../../content/resolve-real-card';

export type AlbumCardRecord = {
  id: string;
  eventId: EventId;
  title: string;
  fact: string;
  sourceLabel: string;
  sourceUrl?: string;
  photoSrc?: string;
  photoAlt: string;
  photoCredit: string;
  mediaLabel?: string;
  savedLabel?: string;
  photoCaption?: string;
  photoSourceUrl?: string;
  contextNote?: string;
  observationNote?: string;
  observationSourceUrl?: string;
};

export function toAlbumCardRecord(card: ResolvedRealCard): AlbumCardRecord {
  return {
    id: card.id,
    eventId: card.eventId,
    title: card.title,
    fact: card.fact,
    sourceLabel: card.sourceLabel,
    sourceUrl: card.sourceUrl,
    photoSrc: card.photoSrc,
    photoAlt: card.photoAlt,
    photoCredit: card.photoCredit,
    savedLabel: card.savedLabel,
    mediaLabel: card.savedLabel,
    ...(card.contextNote ? { contextNote: card.contextNote } : {}),
  };
}

/**
 * Preview album cards resolved from the runtime media catalog.
 * Prefer resolveAlbumCards(state.albumIds) in the live App.
 */
export const FIXTURE_ALBUM: AlbumCardRecord[] = resolveAllRealCards().map(
  toAlbumCardRecord,
);
