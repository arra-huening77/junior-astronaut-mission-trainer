import { useState } from 'react';
import type { SettingsValues } from '../ui/screens/SettingsScreen';

const KEY = 'mms.settings';
export function readClassroomSettings(): SettingsValues {
  const defaults: SettingsValues = {
    classroomMode: false,
    soundEnabled: true,
    reduceMotion:
      globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
      false,
    textSize: 'md',
  };
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
    const value = raw as Record<string, unknown>;
    return {
      classroomMode:
        typeof value.classroomMode === 'boolean'
          ? value.classroomMode
          : defaults.classroomMode,
      soundEnabled:
        typeof value.soundEnabled === 'boolean'
          ? value.soundEnabled
          : value.classroomMode === true
            ? false
            : defaults.soundEnabled,
      reduceMotion:
        typeof value.reduceMotion === 'boolean'
          ? value.reduceMotion
          : value.classroomMode === true
            ? true
            : defaults.reduceMotion,
      textSize:
        value.textSize === 'lg' || value.textSize === 'xl'
          ? value.textSize
          : value.textSize === 'md'
            ? 'md'
            : value.classroomMode === true
              ? 'lg'
              : 'md',
    };
  } catch {
    return defaults;
  }
}

export function classroomDefaults(
  settings: SettingsValues,
  enabled: boolean,
): SettingsValues {
  return enabled
    ? {
        ...settings,
        classroomMode: true,
        soundEnabled: false,
        reduceMotion: true,
        textSize: settings.textSize === 'xl' ? 'xl' : 'lg',
      }
    : { ...settings, classroomMode: false };
}

/** Same-tab consumers update through their owner; storage failures retain usable in-memory settings. */
export function useClassroomSettings() {
  const [settings, setSettings] = useState(readClassroomSettings);
  const [saveWarning, setSaveWarning] = useState('');
  function updateSettings(next: SettingsValues) {
    setSettings(next);
    try {
      let raw: unknown;
      try {
        raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      } catch {
        raw = {};
      }
      const previous =
        raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      localStorage.setItem(KEY, JSON.stringify({ ...previous, ...next }));
      setSaveWarning('');
    } catch {
      setSaveWarning(
        'This setting applies here, but could not be saved for your next visit.',
      );
    }
  }
  function setClassroom(enabled: boolean) {
    updateSettings(classroomDefaults(settings, enabled));
  }

  return { settings, setClassroom, updateSettings, saveWarning };
}
