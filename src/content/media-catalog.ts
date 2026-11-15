import { z } from 'zod';
import { EVENT_IDS } from '../engine/types';
import { isCalendarDate } from '../engine/observation-time';
import photos from './photos.json';
import moments from './realMoments.json';

const photoSchema = z
  .object({
    filename: z.string().regex(/^[\w-]+\.jpg$/),
    src: z.string().regex(/^\/assets\/photos\/[\w-]+\.jpg$/),
    subject: z.string().min(1),
    imageType: z.enum(['photo', 'diagram', 'illustration']),
    savedLabel: z.enum(['Saved photo', 'Saved diagram', 'Saved illustration']),
    sourceUrl: z.string().url(),
    credit: z.string().min(1),
    caption: z.string().min(1),
    altText: z.string().min(1),
    captureDate: z.string().refine(isCalendarDate).optional(),
    publishedDate: z.string().refine(isCalendarDate).optional(),
    mission: z.string().min(1).optional(),
    camera: z.string().min(1).optional(),
    sol: z.number().int().nonnegative().optional(),
    downloadUrl: z.string().url().optional(),
    contextNote: z.string().optional(),
    sourceReview: z.string().min(1),
    sourceCheckedOn: z.string().refine(isCalendarDate),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict()
  .superRefine((photo, context) => {
    if (photo.src !== `/assets/photos/${photo.filename}`)
      context.addIssue({
        code: 'custom',
        message: 'Filename and runtime path differ.',
      });
    if (photo.savedLabel !== `Saved ${photo.imageType}`)
      context.addIssue({
        code: 'custom',
        message: 'Saved label must match the actual image type.',
      });
  });
const factId = z.string().regex(/^F\d{3}$/);
const momentSchema = z
  .object({
    eventId: z.enum(EVENT_IDS),
    factId,
    photoId: z.string().min(1),
    title: z.string().min(1),
    contextNote: z.string().optional(),
    variants: z
      .object({
        calm: z.object({ factId }).strict(),
        active: z.object({ factId }).strict(),
        stormy: z.object({ factId }).strict(),
      })
      .strict()
      .optional(),
  })
  .strict();

/** Structural/reference validation is separate from scientific and image provenance review. */
export function parseMediaCatalog(rawPhotos: unknown, rawMoments: unknown) {
  const photoCatalog = z
    .record(z.string().min(1), photoSchema)
    .parse(rawPhotos);
  const realMoments = z
    .record(z.string().regex(/^rm_/), momentSchema)
    .parse(rawMoments);
  for (const moment of Object.values(realMoments)) {
    if (!photoCatalog[moment.photoId])
      throw new TypeError(`Unknown photo reference: ${moment.photoId}`);
    if (moment.variants && moment.eventId !== 'solar_storm')
      throw new TypeError('Only the solar card has frozen-sky variants.');
  }
  return { photos: photoCatalog, realMoments };
}

export function getMediaCatalog() {
  return parseMediaCatalog(photos, moments);
}
