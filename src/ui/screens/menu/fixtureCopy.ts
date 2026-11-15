/** Preview/fixture copy for title-menu screens. Member 3 owns final glossary/sources content. */

export const GLOSSARY = [
  {
    term: 'Sol',
    definition: 'One Martian day — a little longer than a day on Earth.',
  },
  {
    term: 'Radiation',
    definition: 'Invisible energy from the Sun that can be harmful without protection.',
  },
  {
    term: 'Shield',
    definition: 'Protection that blocks radiation.',
  },
  {
    term: 'Solar panel',
    definition: 'A panel that collects sunlight to make power.',
  },
  {
    term: 'Signal delay',
    definition: 'The time a message takes to travel between Mars and Earth.',
  },
  {
    term: 'Dust storm',
    definition: 'A huge cloud of dust that blocks sunlight.',
  },
  {
    term: 'Launch weight',
    definition: 'How heavy a rocket can safely carry. Our cargo budget is 10 points.',
  },
  {
    term: 'Cargo',
    definition: 'Extra gear we pack before launch — upgrades for air, power, or shielding.',
  },
] as const;

export const DATASET_SOURCES = [
  {
    id: 'donki',
    name: 'NASA DONKI space-weather observations',
    url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
    note: 'Used for Real-Sky calm / active / stormy classification before Plan.',
    status: 'Live / Cached / Saved',
  },
  {
    id: 'gale',
    name: 'Curiosity / Gale Crater mission pages',
    url: 'https://mars.nasa.gov/msl/',
    note: 'Location, weather, and rover facts for Real Mars cards.',
    status: 'Saved',
  },
  {
    id: 'swpc',
    name: 'NOAA / NASA space weather context',
    url: 'https://www.swpc.noaa.gov/',
    note: 'Helps explain why scientists watch the Sun.',
    status: 'Saved',
  },
] as const;

export const PHOTO_SOURCES = [
  {
    id: 'photo-gale',
    title: 'Gale Crater vista (fixture)',
    credit: 'NASA / JPL-Caltech',
    label: 'Saved photo',
    url: 'https://mars.nasa.gov/msl/mission/science/gale-crater/',
  },
  {
    id: 'photo-curiosity',
    title: 'Curiosity rover (fixture)',
    credit: 'NASA / JPL-Caltech',
    label: 'Saved photo',
    url: 'https://mars.nasa.gov/msl/mission/overview/',
  },
] as const;

export const CREDITS = [
  'Mars Mission Survival — Junior Astronaut Mission Trainer',
  'NASA Space Apps Challenge 2026',
  'Game writing and facts verified against NASA/agency pages (see Sources).',
  'This is a training simulation inspired by real NASA science — not a prediction of Mars weather.',
] as const;
