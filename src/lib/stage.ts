export type Stage = {
  index: number;
  name: string;
  startDay: number;
  endDay: number;
};

const STAGE_NAMES = ['Foundation', 'Build', 'Push', 'Refine', 'Reveal'] as const;

/** One zen line per stage, never rotated (DESIGN.md · Microcopy). */
export const STAGE_ZEN: Record<string, string> = {
  Foundation: 'Build the floor.',
  Build: 'Add the weight.',
  Push: 'Lean in.',
  Refine: "Sharpen what's working.",
  Reveal: 'Let it show.',
};

export function stagesFor(totalDays: number): Stage[] {
  const per = Math.max(1, Math.floor(totalDays / 5));
  const stages: Stage[] = [];
  for (let i = 0; i < 5; i += 1) {
    const startDay = i * per + 1;
    const endDay = i === 4 ? totalDays : (i + 1) * per;
    stages.push({ index: i, name: STAGE_NAMES[i], startDay, endDay });
  }
  return stages;
}

export function stageForDay(day: number, totalDays: number): Stage | null {
  if (day < 1 || day > totalDays) return null;
  const stages = stagesFor(totalDays);
  return stages.find((s) => day >= s.startDay && day <= s.endDay) ?? null;
}
