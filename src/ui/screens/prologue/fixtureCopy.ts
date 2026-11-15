/** Prologue narration — Member 3 maps these to story.json keys. */
export const PROLOGUE_LINES = [
  'Hello, Commander! I’m Robo, your mission assistant.',
  'You are in charge of a small crew on Mars. Our outpost sits in Gale Crater, a giant bowl in the ground with a mountain in the middle.',
  'A supply ship is on its way! It will arrive after Sol 10.',
  'Until then, we must keep three things going: air and water, power, and protection from the Sun’s radiation.',
  'Every choice costs something. There are no perfect answers, only smart ones.',
  'Ready, Commander?',
] as const;

/** Stacked glowing team name. */
export const PROLOGUE_TEAM_LINES = ['TINY', 'HABITAT'] as const;

export const PROLOGUE_TAGLINE = 'Mars Mission Survival';

/** @deprecated Prefer PROLOGUE_TEAM_LINES — kept for older preview copy. */
export const PROLOGUE_TITLE = 'MARS MISSION SURVIVAL';
