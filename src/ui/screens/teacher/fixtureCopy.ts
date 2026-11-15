/** Placeholder teacher copy from story-script supporting questions; Member 3 verifies before release. */

export const LESSON_GOALS = [
  'Power is shared — every system draws from the same limited supply.',
  'Radiation needs shielding — storms and space weather matter for crew safety.',
  'Messages take time to cross space — Earth is far away, so plans must be clear.',
] as const;

export const LESSON_PLAN_STEPS = [
  {
    title: 'Warm-up (3 min)',
    body: 'Ask: What would you pack for a week on Mars? List ideas on the board.',
  },
  {
    title: 'Begin the mission (8–10 min)',
    body: 'Students pack cargo, land, and face the first night and dust warning.',
  },
  {
    title: 'Pause & discuss (4 min)',
    body: 'Use the Classroom pause question. Invite two or three short answers.',
  },
  {
    title: 'Continue the mission (5–10 min)',
    body: 'Highlight signal delay and solar activity when they appear.',
  },
  {
    title: 'Wrap-up (2–3 min)',
    body: 'Review the three learning goals. Optional: print certificates.',
  },
] as const;

export const VOCABULARY = [
  {
    term: 'sol',
    meaning: 'A Martian day — about 24 hours and 40 minutes on Mars.',
  },
  {
    term: 'radiation',
    meaning:
      'Invisible energy from the Sun or space that can be harmful without protection.',
  },
  {
    term: 'shield',
    meaning: 'Protection that reduces radiation or impacts around the outpost.',
  },
  {
    term: 'solar panel',
    meaning: 'A panel that turns sunlight into electricity for power.',
  },
  {
    term: 'signal delay',
    meaning:
      'The wait time for a radio message to travel between Earth and Mars.',
  },
  {
    term: 'dust storm',
    meaning: 'Strong winds that lift dust and can cover solar panels.',
  },
  {
    term: 'launch weight',
    meaning: 'How heavy the packed cargo is for the trip to Mars.',
  },
  {
    term: 'cargo',
    meaning: 'Supplies chosen before launch, like batteries or spare parts.',
  },
] as const;

export const DISCUSSION_SAMPLES = [
  {
    sol: 1,
    event: 'Touchdown',
    question: 'Why could we not give the first power to everything?',
    followUp: 'What did your cargo plan help with?',
  },
  {
    sol: 2,
    event: 'First Night',
    question: 'Why do batteries matter when the Sun goes down?',
    followUp: 'What did heating cost?',
  },
  {
    sol: 3,
    event: 'Dust Storm',
    question: 'Why spend power before a storm?',
    followUp: 'When will the dust cost affect us?',
  },
  {
    sol: 4,
    event: 'Ice Hunt',
    question: 'What did the rover trip give us, and what did it use?',
    followUp: 'How did a short trip differ from a long trip?',
  },
  {
    sol: 5,
    event: 'Calling Earth',
    question: 'Why could Earth not answer straight away?',
    followUp: 'What did you decide before the reply?',
  },
  {
    sol: 6,
    event: 'Solar Encounter',
    question: 'What can we do before a possible problem?',
    followUp: 'What did preparing cost?',
  },
  {
    sol: 7,
    event: 'Equipment Failure',
    question: 'What can happen when we delay a repair?',
    followUp: 'What is the tradeoff in a quick patch?',
  },
  {
    sol: 8,
    event: 'Leak / Meteors',
    question: 'How did you protect the outpost?',
    followUp: 'What did your choice use?',
  },
  {
    sol: 9,
    event: 'Cold Night',
    question: 'Which systems did you choose to heat?',
    followUp: 'What did you switch off or give up?',
  },
  {
    sol: 10,
    event: 'Finale',
    question: 'Which earlier decision would you change next time?',
    followUp: 'What real Mars fact surprised you?',
  },
] as const;
