import { useEffect, useRef } from 'react';
import type { SceneTransition } from '../engine/scene-player';
const MUSIC: Record<string, string> = {
  touchdown: 'hopeful space orchestral.mp3',
  first_night: 'quiet ambient piano.mp3',
  dust_storm: 'duststorm.mp3',
  ice_hunt: 'upbeat acoustic.mp3',
  calling_earth: 'quiet ambient piano.mp3',
  solar_storm: 'dark pulsing synth.mp3',
  equipment_failure: 'synth-warning.wav',
  leak: 'quiet ambient piano.mp3',
  meteors: 'quiet ambient piano.mp3',
  cold_night: 'quiet ambient piano.mp3',
  finale: 'heroic cinematic.mp3',
};
export function useMissionAudio(
  transition: SceneTransition | undefined,
  enabled: boolean,
) {
  const key = transition?.playback.cursor.eventId;
  const finalDawn = transition?.playback.game.ending === 'success';
  useEffect(() => {
    if (!enabled || !key || typeof Audio === 'undefined') return;
    const audio = new Audio(
      `/assets/audio/${encodeURIComponent(finalDawn ? 'hopeful space orchestral.mp3' : MUSIC[key])}`,
    );
    audio.loop = true;
    audio.volume = 0.15;
    void audio.play()?.catch(() => {});
    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [enabled, key, finalDawn]);
  const played = useRef<SceneTransition | undefined>(undefined);
  useEffect(() => {
    if (!enabled || !transition || played.current === transition) return;
    played.current = transition;
    const cues = transition.cues.filter(
      (c) => c.type === 'audio' && c.channel === 'sfx' && c.action === 'play',
    );
    const tracks: HTMLAudioElement[] = [];
    for (const cue of cues) {
      if (cue.type !== 'audio') continue;
      const file = cue.cueKey.includes('wrench')
        ? 'WrenchFixing Sounds.wav'
        : cue.cueKey.includes('meteor')
          ? 'meteor whoosh.wav'
          : cue.cueKey.includes('radio')
            ? 'Send Message.mp3'
            : undefined;
      if (!file) continue;
      const audio = new Audio(`/assets/audio/${encodeURIComponent(file)}`);
      audio.volume = 0.18;
      tracks.push(audio);
      void audio.play()?.catch(() => {});
    }
    return () => {
      for (const audio of tracks) audio.pause();
    };
  }, [transition, enabled]);
}
