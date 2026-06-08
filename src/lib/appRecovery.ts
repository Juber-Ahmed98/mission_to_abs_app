// In-session self-heal for a stale PWA shell.
//
// With `registerType: 'autoUpdate'`, a freshly deployed service worker can take
// over a live page (skipWaiting + clientsClaim). If the page then lazy-loads a
// route chunk, it requests the *old* hashed filename — which the new deploy no
// longer ships — and the dynamic `import()` rejects. Without intervention React
// dead-ends at the ErrorBoundary (or a blank Suspense). Instead we reload once to
// pull the current build. A per-session guard stops a reload loop when the
// failure is something a reload can't fix.
//
// The first-paint / main-bundle case (no module executes at all) can't be caught
// here — it's handled by the inline boot-recovery script in index.html, which
// runs from static HTML regardless of whether any chunk loads.

const GUARD = 'mission.chunkRecover';

// Messages browsers use when a dynamically imported module fails to load.
const CHUNK_ERROR =
  /(Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module)/i;

function reloadOnce(): void {
  try {
    if (sessionStorage.getItem(GUARD)) return; // already reloaded this session
    sessionStorage.setItem(GUARD, '1');
  } catch {
    // sessionStorage unavailable (private mode edge) — still attempt one reload.
  }
  window.location.reload();
}

export function installChunkErrorRecovery(): void {
  // Vite's dedicated signal that a preloaded/dynamic chunk failed to load.
  window.addEventListener('vite:preloadError', (e) => {
    e.preventDefault(); // suppress the default throw; we recover by reloading
    reloadOnce();
  });

  // Belt-and-braces: a rejected dynamic import that nothing caught lands here.
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String((e.reason && e.reason.message) || e.reason || '');
    if (CHUNK_ERROR.test(msg)) reloadOnce();
  });
}
