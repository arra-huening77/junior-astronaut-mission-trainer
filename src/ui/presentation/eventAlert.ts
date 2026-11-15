import type { MoodId } from '../../engine/types';

export type EventAlertContent = {
  title: string;
  body: string;
  tone: 'dust' | 'solar' | 'critical' | 'cold' | 'meteors';
};

/** Alert copy for hazard moods. Ambient day/dawn moods return null. */
export function alertForMood(mood: MoodId | null | undefined): EventAlertContent | null {
  switch (mood) {
    case 'dust_storm':
      return {
        title: 'DUST STORM ALERT!',
        body: 'A massive dust storm is approaching Mars!',
        tone: 'dust',
      };
    case 'solar_storm':
    case 'finale_storm':
      return {
        title: 'SOLAR STORM ALERT!',
        body: 'A solar radiation surge is heading for the outpost!',
        tone: 'solar',
      };
    case 'alarm_amber':
      return {
        title: 'SYSTEM ALERT!',
        body: 'Outpost systems need attention — check your meters!',
        tone: 'critical',
      };
    case 'alarm_red':
      return {
        title: 'CRITICAL ALERT!',
        body: 'Life support systems are in the danger zone!',
        tone: 'critical',
      };
    case 'meteors':
      return {
        title: 'METEOR ALERT!',
        body: 'Meteor activity detected near the outpost!',
        tone: 'meteors',
      };
    case 'cold_night':
      return {
        title: 'COLD NIGHT ALERT!',
        body: 'Temperatures are dropping fast — protect the crew!',
        tone: 'cold',
      };
    default:
      return null;
  }
}
