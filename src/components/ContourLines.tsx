// Faint contour lines behind a header (DESIGN.md · Texture): topography
// without image assets, drawn in border-token strokes so both themes carry
// them quietly. Shared by the Dashboard greeting, the Journey header, and the
// completion page.

export default function ContourLines() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 375 100"
      preserveAspectRatio="none"
      fill="none"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
    >
      <path
        d="M-10 82 C 60 66, 130 92, 210 74 S 330 56, 390 70"
        stroke="var(--border)"
        strokeWidth="1"
      />
      <path
        d="M-10 54 C 70 42, 150 66, 240 46 S 345 30, 390 42"
        stroke="var(--border)"
        strokeWidth="1"
      />
      <path
        d="M-10 26 C 85 16, 160 40, 260 20 S 355 8, 390 16"
        stroke="var(--border)"
        strokeWidth="1"
      />
    </svg>
  );
}
