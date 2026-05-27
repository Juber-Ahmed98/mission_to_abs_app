export const MORNING_QUOTES: string[] = [
  'Begin where you are.',
  'Small steps, taken daily.',
  'Today is open.',
  'Consistency over intensity.',
  'Show up. The rest follows.',
  'One day at a time.',
  'The body keeps its promises.',
  'Move first. Think second.',
  'Quiet effort compounds.',
  'Do the next small thing.',
  'Steady wins.',
  'Today is yours to spend.',
  'Strength is a habit.',
  'Patience is also progress.',
  'Move, even slowly.',
  'Discipline is freedom.',
  'Begin before you feel ready.',
  'The work is the reward.',
  'Less, but daily.',
  'Trust the routine.',
  'Action precedes motivation.',
  'Done is better than waiting.',
  'Build today, not someday.',
  'Walk the walk.',
  'Earn the evening.',
  'Eat well. Move well. Rest well.',
  'The plan is simple. Follow it.',
  'Small choices, repeated.',
  'A clean start, again.',
  'Hold the line.',
  'You have time for the work.',
  'Effort speaks for itself.',
  'Choose the harder right.',
  'The streak begins now.',
  'Stay in the boat.',
  'Make today honest.',
  'A good day is built early.',
  'You do not need to feel ready.',
  'Keep your word to yourself.',
  'Begin. Then begin again.',
];

export const EVENING_PROMPTS: string[] = [
  'How was today?',
  'Close today out.',
  'A small note before sleep.',
  'Mark the day.',
  'A quiet end to a long day.',
  'Take a moment for today.',
  'Log what is true.',
  'Settle the day.',
  'Set today down.',
  'One last check-in.',
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
