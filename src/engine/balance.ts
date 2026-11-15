/** README starter values. Do not tune these without the agreed balance review. */
export const BALANCE = {
  startMeters: { life: 80, power: 65, shield: 60 },
  lifeUpkeep: 5,
  solarGain: 12,
  baseLoad: 8,
  meterMin: 0,
  meterMax: 100,
  warnAt: 30,
  dangerAt: 15,
  cargoBudget: 10,
  plantsLifeLoss: 3,
} as const;
