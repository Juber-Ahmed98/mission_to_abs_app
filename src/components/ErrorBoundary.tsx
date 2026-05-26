import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

function downloadCurrentData() {
  try {
    const raw = localStorage.getItem('mission');
    if (!raw) return;
    const persisted = JSON.parse(raw);
    const state =
      persisted && typeof persisted === 'object' && persisted.state && typeof persisted.state === 'object'
        ? (persisted.state as Record<string, unknown>)
        : {};
    const payload = {
      version: typeof persisted?.version === 'number' ? persisted.version : 5,
      settings: state.settings ?? {},
      days: state.days ?? {},
      photos: Array.isArray(state.photos) ? state.photos : [],
      measurements: Array.isArray(state.measurements) ? state.measurements : [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.download = `mission-recovery-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Recovery export failed', e);
  }
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg px-5">
        <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6 text-center">
          <h1 className="text-2xl font-semibold text-text">
            Something went wrong.
          </h1>
          <p className="mt-2 text-sm text-text-muted">Your data is safe.</p>
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => location.reload()}
              className="block h-12 w-full rounded-card bg-accent text-bg font-medium"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={downloadCurrentData}
              className="block h-12 w-full rounded-card border border-border bg-surface-2 text-text"
            >
              Export current data
            </button>
          </div>
        </div>
      </div>
    );
  }
}
