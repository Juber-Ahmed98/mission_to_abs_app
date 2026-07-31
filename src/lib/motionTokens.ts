// The single source for motion values (DESIGN.md · Motion). The CSS side
// (--ease-apple, --duration-*) is emitted from tailwind.config.js; JS-side
// consumers import from here. No component may restate these literals.

/** The house ease. */
export const EASE = [0.32, 0.72, 0, 1] as const;

/** CSS form of the house ease, derived — never restated. */
export const EASE_CSS = `cubic-bezier(${EASE.join(', ')})`;

/** Duration scale in ms (mirrors the --duration-* tokens). */
export const DURATION = {
  fast: 150,
  base: 200,
  sheet: 280,
  slide: 340,
  pop: 450,
  fill: 500,
} as const;

/** Seconds, for framer-motion transition props. */
export const SEC = {
  fast: DURATION.fast / 1000,
  base: DURATION.base / 1000,
  sheet: DURATION.sheet / 1000,
  slide: DURATION.slide / 1000,
  pop: DURATION.pop / 1000,
  fill: DURATION.fill / 1000,
} as const;

/** Medium-register panel entrance (DESIGN.md: spring-panel). */
export const SPRING_PANEL = { type: 'spring', stiffness: 320, damping: 24 } as const;

/** Heavy-register overlay card entrance (DESIGN.md: spring-card). */
export const SPRING_CARD = { type: 'spring', stiffness: 260, damping: 20 } as const;
