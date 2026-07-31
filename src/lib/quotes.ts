// One voice (DESIGN.md · Microcopy): short, declarative, placed. No attributed
// quotes, no fitness content, no hype — the morning line is a companion's word
// at the trailhead, not a coach's. Curated in the Phase 12 voice pass.
export const MORNING_QUOTES: string[] = [
  'Begin where you are.',
  'Small steps, taken daily.',
  'Every morning is a trailhead.',
  'The day asks once.',
  'Show up. The rest follows.',
  'One day at a time.',
  'The body keeps its promises.',
  'Carry only today.',
  'Quiet effort compounds.',
  'Do the next small thing.',
  'Steady wins.',
  'Today is yours to spend.',
  'Slow ground is still ground.',
  'Patience is also progress.',
  'Walk, even slowly.',
  'The trail is patient.',
  'The summit is made of mornings.',
  'The work is the reward.',
  'Less, but daily.',
  'Trust the routine.',
  'No stretch walks itself.',
  'Done is better than waiting.',
  'Build today, not someday.',
  'Walk the walk.',
  'Earn the evening.',
  'Weather changes. The route does not.',
  'Today is one stretch of many.',
  'Small choices, repeated.',
  'A clean start, again.',
  'Hold the line.',
  'You have time for the work.',
  'Effort speaks for itself.',
  'The map only asks for the truth.',
  'One honest mark a day.',
  'Nobody walks it for you.',
  'Make today honest.',
  'A good day is built early.',
  'You do not need to feel ready.',
  'Keep your word to yourself.',
  'Begin. Then begin again.',
];

export const EVENING_PROMPTS: string[] = [
  'How was today?',
  'Close today out.',
  'Mark today as it was.',
  'Mark the day.',
  'A quiet end to a long day.',
  'Take a moment for today.',
  'Log what is true.',
  'Settle the day.',
  'Set today down.',
  'Today still takes a mark.',
];

function hashISO(iso: string): number {
  let h = 0;
  for (let i = 0; i < iso.length; i += 1) {
    h = (h * 31 + iso.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getMorningQuote(iso: string): string {
  const h = hashISO(iso);
  return MORNING_QUOTES[h % MORNING_QUOTES.length];
}

export function getEveningPrompt(iso: string): string {
  const h = hashISO(iso);
  return EVENING_PROMPTS[h % EVENING_PROMPTS.length];
}
