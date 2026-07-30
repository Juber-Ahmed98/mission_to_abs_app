// Ledger fork of BottomNav — text-only small caps under a hairline, like a
// running footer. Active page carries the oxblood underline.

const items = ['Today', 'Journey', 'Progress', 'Photos', 'Settings'];

export default function BottomNav() {
  return (
    <nav
      className="ld-rule-t sticky bottom-0 z-30 mt-auto"
      style={{ background: 'var(--bg)' }}
      aria-label="Ledger navigation (lab preview)"
    >
      <ul className="flex justify-around px-2">
        {items.map((label, i) => {
          const active = i === 0;
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                className="ld-caps flex min-h-[52px] w-full items-center justify-center"
                style={{ color: active ? 'var(--accent)' : 'var(--text-subtle)' }}
              >
                <span
                  className={active ? 'border-b pb-0.5' : undefined}
                  style={active ? { borderColor: 'var(--accent)' } : undefined}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
